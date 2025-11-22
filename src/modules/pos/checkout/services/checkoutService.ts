import { PrismaClient, Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import { CheckoutRequest } from "../schemas/checkoutSchema";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const DUMMY_CASHIER_ID = "00000000-0000-0000-0000-000000000001";
const DUMMY_LOCATION_ID = "32883907-29e9-43a5-901a-c6c425dddbad";

// Use InstanceType<typeof Decimal> for the Decimal instance type
type DecimalInstance = InstanceType<typeof Decimal>;

const calculateItemTotal = (
    price: string | number | Prisma.Decimal,
    quantity: number
) => {
    return new Decimal(price.toString()).times(quantity);
};


export async function processCheckout(checkoutData: CheckoutRequest) {
    const clientTotal = new Decimal(checkoutData.total);
    let serverCalculatedSubtotal = new Decimal(0);

    const salesItemsToCreate: Omit<Prisma.SalesItemCreateManyInput, "salesTransactionId">[] = [];

    return prisma.$transaction(async (tx) => {
        const productIds = checkoutData.cart.map((item) => item.productId);

        const productsWithStock = await tx.product.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                name: true,
                price: true,
                tax_rate: true,
                discount: true,
                stockBalances: {
                    where: { location_id: DUMMY_LOCATION_ID },
                    select: { on_hand_qty: true },
                },
            },
        });

        const productMap = new Map(productsWithStock.map((p) => [p.id, p]));

        for (const cartItem of checkoutData.cart) {
            const product = productMap.get(cartItem.productId);
            if (!product) throw new Error(`Product ${cartItem.productId} not found.`);

            const stockRecord = product.stockBalances[0];
            const availableStock = stockRecord?.on_hand_qty ?? 0;

            if (availableStock < cartItem.quantity) {
                throw new Error(
                    `Insufficient stock for ${product.name}. Required: ${cartItem.quantity}, Available: ${availableStock}`
                );
            }

            const itemSubtotal = calculateItemTotal(product.price, cartItem.quantity);
            serverCalculatedSubtotal = serverCalculatedSubtotal.plus(itemSubtotal);

            salesItemsToCreate.push({
                productId: product.id,
                quantity: cartItem.quantity,
                price: product.price,
                revenue: new Prisma.Decimal(itemSubtotal.toNumber()),
            });
        }

        const serverCalculatedTotal = serverCalculatedSubtotal
            .minus(checkoutData.discountAmount)
            .toDecimalPlaces(2);

        if (!serverCalculatedTotal.equals(clientTotal)) {
            throw new Error("Price mismatch error. Transaction aborted.");
        }

        // ✅ Generate transaction ID
        const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        const newSalesTransaction = await tx.salesTransaction.create({
            data: {
                transactionId,
                amount: new Prisma.Decimal(serverCalculatedTotal.toNumber()),
                discountApplied: new Prisma.Decimal(checkoutData.discountAmount),
                paymentMethod: checkoutData.paymentMethod,
                cashierId: DUMMY_CASHIER_ID,
                status: "COMPLETED",
            },
        });

        const itemsWithTransactionId = salesItemsToCreate.map((item) => ({
            ...item,
            salesTransactionId: newSalesTransaction.id,
        }));

        await tx.salesItem.createMany({ data: itemsWithTransactionId });

        for (const item of checkoutData.cart) {
            await tx.stockBalance.update({
                where: {
                    product_id_location_id: {
                        product_id: item.productId,
                        location_id: DUMMY_LOCATION_ID,
                    },
                },
                data: { on_hand_qty: { decrement: item.quantity } },
            });

            await tx.stockMove.create({
                data: {
                    product_id: item.productId,
                    from_location_id: DUMMY_LOCATION_ID,
                    qty: item.quantity,
                    reason: "SALE",
                    ref_type: "SALES_TRANSACTION",
                    ref_id: newSalesTransaction.id,
                    created_by: DUMMY_CASHIER_ID,
                },
            });
        }

        return newSalesTransaction.id;
    });
}
