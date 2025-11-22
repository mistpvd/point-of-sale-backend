import { Request, Response } from 'express';
import { PrismaClient , Prisma} from '@prisma/client';
import { CreateStoreSchema } from '../schemas/createStoreSchema';
import { ZodError } from 'zod';

const prisma = new PrismaClient();

// POST /stores
export const createStore = async (req: Request, res: Response) => {
    try {
        const input = CreateStoreSchema.parse(req.body);

        const store = await prisma.store.create({
            data: {
                name: input.name,
                location: input.location,
            },
        });

        res.status(201).json(store);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: error.issues });
        }

        console.error('Error creating store:', error);
        res.status(500).json({ error: 'Failed to create store' });
    }
};

// GET /stores
export const getStores = async (_req: Request, res: Response) => {
    try {
        const stores = await prisma.store.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(stores);
    } catch (error) {
        console.error('Error fetching stores:', error);
        res.status(500).json({ error: 'Failed to fetch stores' });
    }
};

// PUT /stores/:id
export const updateStore = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, location } = req.body;

    try {
        const updated = await prisma.store.update({
            where: { id },
            data: { name, location },
        });
        res.json(updated);
    } catch (error) {
        console.error('Error updating store:', error);
        res.status(500).json({ error: 'Failed to update store' });
    }
};

// DELETE /stores/:id
export const deleteStore = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.store.delete({ where: { id } });
        res.json({ message: 'Store deleted successfully' });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2025'
        ) {
            return res.status(404).json({ error: 'Store not found' });
        }

        console.error('Error deleting store:', error);
        res.status(500).json({ error: 'Failed to delete store' });
    }
};
