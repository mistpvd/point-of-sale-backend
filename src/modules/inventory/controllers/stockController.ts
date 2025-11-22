import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ZodError, z } from 'zod';
import { processStockTransaction } from "../services/stockService";

const prisma = new PrismaClient();

// --- Zod Schemas for Transactional Endpoints ---

// Schema for Stock Receipt (Adding stock, e.g., Purchase Order receipt)
const StockReceiptSchema = z.object({
    productId: z.string().uuid(),
    locationId: z.string().uuid(), // Receiving location
    qty: z.number().int().positive(),
    refType: z.string().default('PO'),
    refId: z.string().min(1),
    unitCost: z.number().positive().multipleOf(0.01).optional(),
});

// Schema for Stock Issue (Removing stock, e.g., Sale)
const StockIssueSchema = z.object({
    productId: z.string().uuid(),
    locationId: z.string().uuid(), // Location stock is issued from
    qty: z.number().int().positive(),
    refType: z.string().default('SALE'),
    refId: z.string().min(1),
});

// Schema for Stock Transfer
const StockTransferSchema = z.object({
    productId: z.string().uuid(),
    fromLocationId: z.string().uuid(),
    toLocationId: z.string().uuid(),
    qty: z.number().int().positive(),
});

// Schema for Stock Adjustment (Increase or Decrease)
const StockAdjustmentSchema = z.object({
    productId: z.string().uuid(),
    locationId: z.string().uuid(),
    qtyChange: z.number().int().refine(val => val !== 0, { message: "Quantity change cannot be zero." }), // Positive for increase, Negative for decrease
    reason: z.string().min(5),
});

// ----------------------------------------------------------------------
// TRANSACTIONAL CONTROLLERS (For POS functionality)
// ----------------------------------------------------------------------

/**
 * 1. RECEIVE STOCK (Add Stock, e.g., Purchase Receipt)
 */
export const receiveStock = async (req: Request, res: Response) => {
    try {
        const input = StockReceiptSchema.parse(req.body);
        const userId = req.body.userId || 'SYSTEM'; // Placeholder: replace with actual user ID from auth

        const { stockMove, stockBalance } = await processStockTransaction({
            productId: input.productId,
            fromLocationId: undefined,
            toLocationId: input.locationId,
            qty: input.qty,
            reason: 'RECEIPT',
            refType: input.refType,
            refId: input.refId,
            unitCost: input.unitCost,
            userId: userId,
        });

        res.status(200).json({ message: 'Stock successfully received.', stockMove, stockBalance });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: error.issues });
        }
        console.error('Error receiving stock:', error);
        res.status(500).json({ error: (error as Error).message || 'Failed to process stock receipt.' });
    }
};

/**
 * 2. ISSUE STOCK (Remove Stock, e.g., POS Sale)
 */
export const issueStock = async (req: Request, res: Response) => {
    try {
        const input = StockIssueSchema.parse(req.body);
        const userId = req.body.userId || 'SYSTEM';

        const { stockMove, stockBalance } = await processStockTransaction({
            productId: input.productId,
            fromLocationId: input.locationId,
            toLocationId: undefined,
            qty: input.qty,
            reason: 'SALE',
            refType: input.refType,
            refId: input.refId,
            userId: userId,
        });

        res.status(200).json({ message: 'Stock successfully issued.', stockMove, stockBalance });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: error.issues });
        }
        console.error('Error issuing stock:', error);
        res.status(500).json({ error: (error as Error).message || 'Failed to process stock issue.' });
    }
};

/**
 * 3. TRANSFER STOCK (Move between two locations)
 * This must be a single transaction wrapping two moves (OUT and IN) for atomicity.
 */
export const transferStock = async (req: Request, res: Response) => {
    try {
        const input = StockTransferSchema.parse(req.body);

        if (input.fromLocationId === input.toLocationId) {
            return res.status(400).json({ error: 'Source and destination locations must be different.' });
        }

        const userId = req.body.userId || 'SYSTEM';
        const transferRef = `TRF-${Date.now()}-${input.productId.substring(0, 4)}`;

        // We run a single DB transaction for two linked stock moves
        const result = await prisma.$transaction(async (tx) => {

            // 3a. Stock OUT from Source (TRANSFER_OUT)
            await (tx as any).stockMove.create({
                data: {
                    product_id: input.productId,
                    from_location_id: input.fromLocationId,
                    to_location_id: input.toLocationId,
                    qty: input.qty,
                    reason: 'TRANSFER_OUT',
                    ref_type: 'TRF',
                    ref_id: transferRef,
                    created_by: userId,
                },
            });

            await tx.stockBalance.update({
                where: { product_id_location_id: { product_id: input.productId, location_id: input.fromLocationId } },
                data: { on_hand_qty: { decrement: input.qty }, available_qty: { decrement: input.qty } },
            });

            // 3b. Stock IN at Destination (TRANSFER_IN)
            const receiptMove = await (tx as any).stockMove.create({
                data: {
                    product_id: input.productId,
                    from_location_id: input.fromLocationId,
                    to_location_id: input.toLocationId,
                    qty: input.qty,
                    reason: 'TRANSFER_IN',
                    ref_type: 'TRF',
                    ref_id: transferRef,
                    created_by: userId,
                },
            });

            // Using upsert pattern for the destination to handle new locations
            const stockBalance = await tx.stockBalance.upsert({
                where: { product_id_location_id: { product_id: input.productId, location_id: input.toLocationId } },
                update: { on_hand_qty: { increment: input.qty }, available_qty: { increment: input.qty } },
                create: { product_id: input.productId, location_id: input.toLocationId, on_hand_qty: input.qty, available_qty: input.qty },
            });

            return { receiptMove, stockBalance };
        });

        res.status(200).json({ message: 'Stock successfully transferred.', ...result });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: error.issues });
        }
        console.error('Error transferring stock:', error);
        res.status(500).json({ error: (error as Error).message || 'Failed to process stock transfer.' });
    }
};

/**
 * 4. ADJUST STOCK (Manual Increase/Decrease)
 */
export const adjustStock = async (req: Request, res: Response) => {
    try {
        // ✅ Validate request body using Zod
        const input = StockAdjustmentSchema.parse(req.body);
        const userId = req.body.userId || 'SYSTEM';

        const { productId, locationId, qtyChange, reason } = input;
        const isIncrease = qtyChange > 0;
        const qty = Math.abs(qtyChange);

        // ✅ Perform the stock transaction (updates StockMove and StockBalance)
        const { stockMove, stockBalance } = await processStockTransaction({
            productId,
            fromLocationId: isIncrease ? undefined : locationId,
            toLocationId: isIncrease ? locationId : undefined,
            qty,
            reason: isIncrease ? 'ADJUST_INCREASE' : 'ADJUST_DECREASE',
            refType: 'ADJ',
            refId: `ADJ-${Date.now()}`,
            userId: userId,
        });

        // ✅ Recalculate total stock across all locations
        const totalStockAgg = await prisma.stockBalance.aggregate({
            where: { product_id: productId },
            _sum: { on_hand_qty: true },
        });

        const newTotalStock = totalStockAgg._sum.on_hand_qty || 0;

        // ✅ Update product’s total_stock column (Removed duplicate update and error suppression)
        await prisma.product.update({
            where: { id: productId },
            data: { total_stock: newTotalStock },
        });

        res.status(200).json({
            message: 'Stock successfully adjusted.',
            stockMove,
            stockBalance,
            totalStock: newTotalStock,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: error.issues });
        }
        // If the product ID is not found in prisma.product.update, the error will be caught here.
        console.error('Error adjusting stock:', error);
        res.status(500).json({ error: (error as Error).message || 'Failed to process stock adjustment.' });
    }
};



// ----------------------------------------------------------------------
// READ CONTROLLERS (Essential for UI rendering)
// ----------------------------------------------------------------------

/**
 * Gets enriched stock balances (Overview Tab)
 */
export const getStockBalances = async (_req: Request, res: Response) => {
    try {
        const stockBalances = await prisma.stockBalance.findMany({
            include: {
                product: {
                    select: { name: true, sku: true, uom: true, barcode: true, category: { select: { name: true } } }
                },
                location: { select: { name: true } },
            },
            orderBy: [{ product: { name: 'asc' } }, { location: { name: 'asc' } }],
        });

        const formatted = stockBalances.map(sb => ({
            productId: sb.product_id,
            productName: sb.product.name,
            sku: sb.product.sku,
            barcode: sb.product.barcode,
            uom: sb.product.uom,
            categoryName: sb.product.category?.name || 'N/A',
            locationId: sb.location_id,
            locationName: sb.location.name,
            onHandQty: sb.on_hand_qty,
            committedQty: sb.committed_qty,
            availableQty: sb.available_qty,
            updatedAt: sb.updated_at.toISOString(),
        }));

        res.status(200).json(formatted);
    } catch (err: any) {
        console.error('Error fetching stock balances:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Gets stock movement history (Movements Tab)
 */

export const getStockMovements = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const moves = await prisma.stockMove.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                product: { select: { name: true, sku: true } },
                from_location: { select: { name: true } },
                to_location: { select: { name: true } },
            },
        });

        const formatted = moves.map(m => ({
            id: m.id,
            productId: m.product_id,
            productName: m.product?.name ?? 'Unknown Product',
            sku: m.product?.sku ?? '-',
            fromLocation: m.from_location?.name ?? 'N/A',
            toLocation: m.to_location?.name ?? 'N/A',
            qty: m.qty,
            reason: m.reason,
            createdAt: m.created_at,
        }));

        res.status(200).json(formatted);
    } catch (err) {
        next(err);
    }
};