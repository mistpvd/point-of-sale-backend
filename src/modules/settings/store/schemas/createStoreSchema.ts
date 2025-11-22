// src/modules/settings/store/schemas/createStoreSchema.ts
import { z } from 'zod';

export const CreateStoreSchema = z.object({
    name: z.string().min(3, "Store name is required"),
    location: z.string().optional(),
});
