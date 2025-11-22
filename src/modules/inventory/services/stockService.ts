import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ Transaction client type helper
export type Tx = Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

interface StockTransactionData {
    productId: string;
    fromLocationId?: string;
    toLocationId?: string;
    qty: number;
    reason: string;
    refType?: string;
    refId?: string;
    unitCost?: number;
    userId: string;
}

async function refreshProductStock(tx: Tx, productId: string) {
    const total = await tx.stockBalance.aggregate({
        where: { product_id: productId },
        _sum: { available_qty: true },
    });

    const totalStock = total._sum.available_qty ?? 0;

    await tx.product.update({
        where: { id: productId },
        data: {
            total_stock: totalStock,
            isInStock: totalStock > 0,
        },
    });

    return totalStock;
}

export async function processStockTransaction(data: StockTransactionData) {
    const isIncoming = data.toLocationId && !data.fromLocationId;
    const isOutgoing = data.fromLocationId && !data.toLocationId;
    const locationId = data.toLocationId || data.fromLocationId;
    const qtyChange = isIncoming ? data.qty : isOutgoing ? -data.qty : 0;

    if (!locationId) {
        throw new Error("A location (either 'to' or 'from') must be provided for the move.");
    }

    const [productExists, locationExists] = await Promise.all([
        prisma.product.findUnique({ where: { id: data.productId } }),
        prisma.location.findUnique({ where: { id: locationId } }),
    ]);

    if (!productExists) throw new Error(`Product not found for ID: ${data.productId}`);
    if (!locationExists) throw new Error(`Location not found for ID: ${locationId}`);

    return prisma.$transaction(async (tx) => {
        const stockMove = await tx.stockMove.create({
            data: {
                product_id: data.productId,
                from_location_id: data.fromLocationId,
                to_location_id: data.toLocationId,
                qty: data.qty,
                unit_cost: data.unitCost,
                reason: data.reason,
                ref_type: data.refType,
                ref_id: data.refId,
                created_by: data.userId,
            },
        });

        let stockBalance;
        try {
            stockBalance = await tx.stockBalance.update({
                where: {
                    product_id_location_id: {
                        product_id: data.productId,
                        location_id: locationId,
                    },
                },
                data: {
                    on_hand_qty: { increment: qtyChange },
                    available_qty: { increment: qtyChange },
                    updated_at: new Date(),
                },
            });

            if (stockBalance.on_hand_qty < 0) {
                throw new Error('Transaction failed: cannot result in negative on-hand stock.');
            }
        } catch (e: any) {
            if (e.code === 'P2025' && isIncoming) {
                stockBalance = await tx.stockBalance.create({
                    data: {
                        product_id: data.productId,
                        location_id: locationId,
                        on_hand_qty: data.qty,
                        committed_qty: 0,
                        available_qty: data.qty,
                    },
                });
            } else {
                throw e;
            }
        }

        const totalStock = await refreshProductStock(tx, data.productId);

        return { stockMove, stockBalance, totalStock };
    });
}
