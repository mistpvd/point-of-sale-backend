// src/modules/inventory/stock/controllers/stockAuditController.ts

import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express"; // ✅ Import Express types

const prisma = new PrismaClient();

/**
 * GET /api/v1/stock/audit
 * Audits product total_stock values against stockBalances.
 */
export async function auditStock(req: Request, res: Response) {
    try {
        const products = await prisma.product.findMany({
            include: {
                stockBalances: true,
            },
        });

        const report = products.map((p) => {
            const totalCalculated = p.stockBalances.reduce(
                (sum, sb) => sum + sb.available_qty,
                0
            );

            return {
                id: p.id,
                sku: p.sku,
                name: p.name,
                total_stock_field: p.total_stock,
                total_stock_calculated: totalCalculated,
                match: p.total_stock === totalCalculated,
            };
        });

        const mismatches = report.filter((r) => !r.match);

        return res.json({
            summary: {
                totalProducts: report.length,
                mismatches: mismatches.length,
            },
            mismatches,
        });
    } catch (err) {
        console.error("❌ Stock audit failed:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
