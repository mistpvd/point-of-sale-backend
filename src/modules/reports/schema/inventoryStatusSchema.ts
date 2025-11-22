// src/modules/reports/schemas/inventoryStatusSchema.ts
import { z } from 'zod';

export const InventoryStatusSchema = z.object({
    lowStockCount: z.number().int(),
    outOfStockCount: z.number().int(),
    healthyCount: z.number().int(),
});
