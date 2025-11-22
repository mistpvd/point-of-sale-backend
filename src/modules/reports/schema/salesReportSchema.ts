// src/modules/reports/schemas/salesReportSchema.ts
import { z } from 'zod';

export const SalesChartItemSchema = z.object({
    date: z.string(), // Format: 'yyyy-MM-dd'
    revenue: z.number(),
    orders: z.number().int(),
    averageOrderValue: z.number(),
});

export const SalesChartSchema = z.array(SalesChartItemSchema);
