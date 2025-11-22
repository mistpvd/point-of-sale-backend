// src/middlewares/mapper.ts
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    console.error(err);

    if (err.name === 'ZodError') {
        return res.status(400).json({ error: err.errors });
    }

    if (err.code === 'P2002') {
        return res.status(409).json({ error: 'Duplicate value violation' });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Resource not found' });
    }

    res.status(500).json({ error: 'Internal server error' });
}
