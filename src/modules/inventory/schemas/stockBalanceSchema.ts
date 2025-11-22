// src/modules/inventory/stock/schemas/stockBalanceSchema.ts
import { z } from 'zod';

export const CreateOrUpdateStockBalanceSchema = z.object({
    productId: z.string().uuid(),
    locationId: z.string().uuid(),
    onHandQty: z.number().int().nonnegative(),
    committedQty: z.number().int().nonnegative(),
});
