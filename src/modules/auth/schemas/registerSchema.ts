// schemas/registerSchema.ts
import { z } from 'zod';

export const RegisterSchema = z.object({
    businessName: z.string().min(1, 'Business name is required'),
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    // Note: confirmPassword is a frontend validation concern, not a backend data field.
});

export type RegisterInput = z.infer<typeof RegisterSchema>;