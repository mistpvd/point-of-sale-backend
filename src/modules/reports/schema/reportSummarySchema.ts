// src/modules/reports/schemas/reportSummarySchema.ts
import { z } from 'zod';

export const ReportSummarySchema = z.object({
    totalRevenue: z.number(),
    orderCount: z.number().int(),
    averageOrderValue: z.number(),
    satisfaction: z.number().nullable(),
});
