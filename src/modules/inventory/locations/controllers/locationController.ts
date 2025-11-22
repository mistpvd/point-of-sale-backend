// src/modules/inventory/location/controllers/locationController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createLocationSchema } from '../schemas/locationSchema';
import { ZodError } from 'zod';

const prisma = new PrismaClient();

// POST /locations
export const createLocation = async (req: Request, res: Response) => {
    try {
        const data = createLocationSchema.parse(req.body);

        const location = await prisma.location.create({
            data: {
                name: data.name,
                address: data.address,
            },
        });

        res.status(201).json(location);
    } catch (err) {
        if (err instanceof ZodError) {
            return res.status(400).json({ errors: err.issues });
        }

        console.error('Error creating location:', err);
        res.status(500).json({ error: 'Failed to create location' });
    }
};

// GET /locations
export const getLocations = async (_req: Request, res: Response) => {
    try {
        const locations = await prisma.location.findMany({
            where: { is_active: true },
            orderBy: { name: 'asc' },
        });

        res.json(locations);
    } catch (err) {
        console.error('Error fetching locations:', err);
        res.status(500).json({ error: 'Failed to fetch locations' });
    }
};
