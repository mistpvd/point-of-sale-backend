// src/schemas/checkoutSchema.ts

import { z } from "zod";

// Helper for UUID validation (as per your productSchema snippet)
const uuid = z.string().uuid();
// Helper for currency values, requiring a positive number with max 2 decimal places
const currencyDecimal = z.number().positive().multipleOf(0.01);

// Schema for a single item in the cart
const checkoutItemSchema = z.object({
    productId: uuid,
    quantity: z.number().int().min(1, "Quantity must be at least 1."),
});

// Main checkout request body schema
export const checkoutRequestSchema = z.object({
    cart: z.array(checkoutItemSchema).min(1, "Cart cannot be empty."),
    // Frontend-calculated totals (used for comparison/security)
    total: currencyDecimal,
    discountAmount: z.number().min(0).multipleOf(0.01),
    // Validate the payment method against an expected list
    paymentMethod: z.enum(["Cash", "Bank", "Ecocash"], {
        message: "Payment method must be one of: Cash, Bank, or Ecocash.",
    }),
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;