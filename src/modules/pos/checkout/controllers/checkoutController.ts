// src/controllers/checkoutController.ts

import { Request, Response, NextFunction } from 'express';
import { checkoutRequestSchema } from '../schemas/checkoutSchema';
import { processCheckout } from '../services/checkoutService';

// Middleware to use Zod for validation
const validateCheckout = (req: Request, res: Response, next: NextFunction) => {
    try {
        req.body = checkoutRequestSchema.parse(req.body);
        next();
    } catch (error) {
        // Zod validation failed
        return res.status(400).json({
            success: false,
            error: "Invalid request data.",
            details: error
        });
    }
}

export const checkout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // req.body is already validated by middleware
        const orderId = await processCheckout(req.body);

        // Success response (HTTP 201 Created)
        res.status(201).json({
            success: true,
            orderId: orderId,
            message: "Checkout successful. Order completed."
        });
    } catch (error) {
        // Handle specific business errors (stock, price mismatch)
        if (error instanceof Error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        // Catch all other errors (database connection, unknown server issues)
        next(error); // Pass to Express error handler
    }
}

// Export the middleware and controller
export default { validateCheckout, checkout };