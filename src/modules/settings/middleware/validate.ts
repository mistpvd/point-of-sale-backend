// src/middleware/validate.ts

import { Request, Response, NextFunction } from 'express';
import { ZodObject } from 'zod';

// HOF (Higher-Order Function) that takes a Zod schema and returns Express middleware
export const validate = (schema: ZodObject<any>) =>
    (req: Request, res: Response, next: NextFunction) => {

        try {
            // Attempt to parse/validate the request body
            schema.parse(req.body);

            // If successful, continue to the next middleware or controller
            next();
        } catch (error: any) {
            // If validation fails, return a 400 Bad Request with Zod's structured errors
            if (error.issues) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Validation failed',
                    errors: error.issues.map((issue: any) => ({
                        path: issue.path.join('.'),
                        message: issue.message,
                    })),
                });
            }

            // Handle unexpected errors
            res.status(500).json({ status: 'error', message: 'Internal validation error' });
        }
    };
