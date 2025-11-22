// src/controllers/reportController.ts
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { format, parseISO, isValid } from 'date-fns';
import { z } from 'zod';

// Schemas
import { ReportSummarySchema } from '../schema/reportSummarySchema';
import { SalesChartSchema } from '../schema/salesReportSchema';
import { TopProductsSchema } from '../schema/topProductsSchema';
import { InventoryStatusSchema } from '../schema/inventoryStatusSchema';
import { RecentActivitySchema } from '../schema/recentActivitySchema';

const prisma = new PrismaClient();

/**
 * Helper to parse a date string or fallback
 */
function parseDateOrDefault(input: string | undefined, fallback: Date): Date {
    if (!input) return fallback;
    const parsed = parseISO(input);
    return isValid(parsed) ? parsed : fallback;
}

// ========== 1. Report Summary ==========
export async function getReportSummary(req: Request, res: Response) {
    try {
        const { startDate, endDate } = req.query;
        const from = parseDateOrDefault(startDate as string, new Date(new Date().setDate(new Date().getDate() - 7)));
        const to = parseDateOrDefault(endDate as string, new Date());

        const sales = await prisma.salesTransaction.findMany({
            where: { createdAt: { gte: from, lte: to } },
            select: { id: true, amount: true }
        });

        const totalRevenue = sales.reduce((sum, s) => sum + Number(s.amount), 0);
        const orderCount = sales.length;
        const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

        const feedbacks = await prisma.feedback.findMany({
            where: { createdAt: { gte: from, lte: to } },
            select: { rating: true }
        });

        const avgSatisfaction =
            feedbacks.length > 0
                ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
                : null;

        const response = ReportSummarySchema.parse({
            totalRevenue,
            orderCount,
            averageOrderValue,
            satisfaction: avgSatisfaction
        });

        return res.json(response);
    } catch (error) {
        console.error("getReportSummary error:", error);
        return res.status(500).json({ error: "Failed to fetch report summary" });
    }
}

// ========== 2. Sales Report (chart) ==========
export async function getSalesReport(req: Request, res: Response) {
    try {
        const { startDate, endDate } = req.query;
        const from = parseDateOrDefault(startDate as string, new Date(new Date().setDate(new Date().getDate() - 7)));
        const to = parseDateOrDefault(endDate as string, new Date());

        const sales = await prisma.salesTransaction.findMany({
            where: { createdAt: { gte: from, lte: to } },
            select: { createdAt: true, amount: true },
            orderBy: { createdAt: 'asc' }
        });

        const grouped: Record<string, { revenue: number; orders: number }> = {};
        sales.forEach(s => {
            const date = format(s.createdAt, "yyyy-MM-dd");
            if (!grouped[date]) grouped[date] = { revenue: 0, orders: 0 };
            grouped[date].revenue += Number(s.amount);
            grouped[date].orders += 1;
        });

        const result = Object.entries(grouped).map(([date, { revenue, orders }]) => ({
            date,
            revenue,
            orders,
            averageOrderValue: orders > 0 ? revenue / orders : 0
        }));

        const response = SalesChartSchema.parse(result);
        return res.json(response);
    } catch (error) {
        console.error("getSalesReport error:", error);
        return res.status(500).json({ error: "Failed to fetch sales report" });
    }
}

// ========== 3. Top Products ==========
export async function getTopProducts(req: Request, res: Response) {
    try {
        const { startDate, endDate, limit } = req.query;
        const from = startDate ? parseDateOrDefault(startDate as string, new Date(0)) : undefined;
        const to = endDate ? parseDateOrDefault(endDate as string, new Date()) : undefined;
        const topN = Number(limit) || 5;

        const grouped = await prisma.salesItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true, revenue: true },
            where: {
                ...(from && to && {
                    salesTransaction: {
                        createdAt: { gte: from, lte: to }
                    }
                })
            },
            orderBy: { _sum: { revenue: 'desc' } },
            take: topN
        });

        const productIds = grouped.map(g => g.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true }
        });

        const result = grouped.map(g => {
            const prod = products.find(p => p.id === g.productId);
            return {
                productId: g.productId,
                name: prod?.name ?? "Unknown",
                sales: g._sum.quantity ?? 0,
                revenue: g._sum.revenue ?? 0
            };
        });

        const response = TopProductsSchema.parse(result);
        return res.json(response);
    } catch (error) {
        console.error("getTopProducts error:", error);
        return res.status(500).json({ error: "Failed to fetch top products" });
    }
}

// ========== 4. Inventory Status ==========
export async function getInventoryStatus(req: Request, res: Response) {
    try {
        const LOW_THRESHOLD = 10;
        const OUT_THRESHOLD = 0;

        const grouped = await prisma.stockBalance.groupBy({
            by: ['product_id'],
            _sum: { on_hand_qty: true }
        });

        let outOfStockCount = 0;
        let lowStockCount = 0;
        let healthyCount = 0;

        grouped.forEach(g => {
            const qty = g._sum.on_hand_qty ?? 0;
            if (qty <= OUT_THRESHOLD) outOfStockCount++;
            else if (qty <= LOW_THRESHOLD) lowStockCount++;
            else healthyCount++;
        });

        const response = InventoryStatusSchema.parse({
            lowStockCount,
            outOfStockCount,
            healthyCount
        });

        return res.json(response);
    } catch (error) {
        console.error("getInventoryStatus error:", error);
        return res.status(500).json({ error: "Failed to fetch inventory status" });
    }
}

// ========== 5. Recent Activity ==========
export async function getRecentActivity(req: Request, res: Response) {
    try {
        const { limit } = req.query;
        const max = Number(limit) || 10;

        const logs = await prisma.auditLog.findMany({
            orderBy: { createdTs: 'desc' },
            take: max,
            select: {
                id: true,
                userId: true,
                action: true,
                entity: true,
                entityId: true,
                metadata: true,
                createdTs: true
            }
        });

        const userIds = logs.map(l => l.userId);
        const users = userIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, username: true }
            })
            : [];

        const result = logs.map(l => ({
            id: l.id,
            user: users.find(u => u.id === l.userId)?.username ?? "Unknown",
            action: l.action,
            entity: l.entity,
            entityId: l.entityId,
            metadata: l.metadata,
            timestamp: l.createdTs.toISOString()
        }));

        const response = RecentActivitySchema.parse(result);
        return res.json(response);
    } catch (error) {
        console.error("getRecentActivity error:", error);
        return res.status(500).json({ error: "Failed to fetch recent activity" });
    }
}
