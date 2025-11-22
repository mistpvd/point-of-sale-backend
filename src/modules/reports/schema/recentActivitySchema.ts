// src/modules/reports/schemas/recentActivitySchema.ts
import { z } from 'zod';

export const RecentActivityItemSchema = z.object({
    id: z.string().uuid(),
    user: z.string(), // username
    action: z.string(),
    entity: z.string(),
    entityId: z.string(),
    metadata: z.any(), // or use `z.record(z.any())` if it's always an object
    timestamp: z.string().datetime(), // ISO 8601 format
});

export const RecentActivitySchema = z.array(RecentActivityItemSchema);
