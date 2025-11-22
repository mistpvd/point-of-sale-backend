// src/schemas/createUserSchema.ts
import { z } from 'zod';

export const CreateUserSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["ADMIN", "MANAGER", "CASHIER", "CLERK", "COLLECTOR"]),
    storeId: z.string().uuid(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
