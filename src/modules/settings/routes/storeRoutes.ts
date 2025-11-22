import { Router } from 'express';
import prisma from '../utils/prisma';
import { validate } from '../middleware/validate';
import { StoreSchema, UpdateStoreSchema } from '../schemas/settingsSchema';
import { Prisma } from '@prisma/client';

const router = Router();
// router.use(protect);
// router.use(restrictTo('admin'));

/** GET all stores */
router.get('/stores', async (req, res) => {
    try {
        const stores = await prisma.store.findMany({
            orderBy: { name: 'asc' },
        });
        res.status(200).json({ status: 'success', data: stores });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Failed to fetch stores:', error.message);
            res.status(500).json({ status: 'error', message: 'Failed to fetch stores' });
        } else {
            console.error('An unknown error occurred:', error);
            res.status(500).json({ status: 'error', message: 'Failed to fetch stores' });
        }
    }
});

/** POST create new store */
router.post('/stores', validate(StoreSchema.omit({ id: true })), async (req, res) => {
    const data = req.body;
    try {
        const newStore = await prisma.store.create({
            data: data,
        });
        res.status(201).json({ status: 'success', data: newStore });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Failed to create store:', error.message);
            res.status(500).json({ status: 'error', message: 'Failed to create store' });
        } else {
            console.error('An unknown error occurred:', error);
            res.status(500).json({ status: 'error', message: 'Failed to create store' });
        }
    }
});

/** PATCH update store info */
router.patch('/stores/:id', validate(UpdateStoreSchema), async (req, res) => {
    const { id } = req.params;
    const data = req.body; // Contains fields to update

    try {
        const updatedStore = await prisma.store.update({
            where: { id },
            data: data, // Prisma handles partial updates and `updatedAt` field automatically
        });

        res.status(200).json({ status: 'success', data: updatedStore });
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle Prisma-specific error, such as when a record is not found
            if (error.code === 'P2025') {
                return res.status(404).json({ status: 'fail', message: 'Store not found' });
            }
        }

        // Handle other types of errors (e.g., general errors)
        if (error instanceof Error) {
            console.error('Failed to update store:', error.message);
            res.status(500).json({ status: 'error', message: 'Failed to update store' });
        } else {
            console.error('An unknown error occurred:', error);
            res.status(500).json({ status: 'error', message: 'Failed to update store' });
        }
    }
});

export default router;
