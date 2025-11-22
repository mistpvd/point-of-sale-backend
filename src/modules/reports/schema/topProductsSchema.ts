// src/modules/reports/schemas/topProductsSchema.ts
import { z } from 'zod';

export const TopProductSchema = z.object({
    productId: z.string().uuid(),
    name: z.string(),
    sales: z.number().int(),
    revenue: z.number(),
});

export const TopProductsSchema = z.array(TopProductSchema);
