import { Router } from 'express';
import prisma from '../utils/prisma';
import { validate } from '../middleware/validate';
import { TerminalSchema, UpdateTerminalSchema } from '../schemas/settingsSchema';
import { Prisma } from '@prisma/client';

const router = Router();
// router.use(protect);
// router.use(restrictTo('admin'));

/** GET all terminals */
router.get('/terminals', async (req, res) => {
    try {
        const terminals = await prisma.terminal.findMany({
            orderBy: { name: 'asc' },
        });
        res.status(200).json({ status: 'success', data: terminals });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Failed to fetch terminals:', error.message);
            res.status(500).json({ status: 'error', message: 'Failed to fetch terminals' });
        } else {
            console.error('An unknown error occurred:', error);
            res.status(500).json({ status: 'error', message: 'Failed to fetch terminals' });
        }
    }
});

/** POST create new terminal */
router.post('/terminals', validate(TerminalSchema.omit({ id: true })), async (req, res) => {
    const data = req.body;
    try {
        const newTerminal = await prisma.terminal.create({
            data: {
                ...data,
                // Note: Prisma will automatically handle converting cash_drawer and status to their schema types
            },
        });
        res.status(201).json({ status: 'success', data: newTerminal });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Failed to create terminal:', error.message);
            res.status(500).json({ status: 'error', message: 'Failed to create terminal' });
        } else {
            console.error('An unknown error occurred:', error);
            res.status(500).json({ status: 'error', message: 'Failed to create terminal' });
        }
    }
});

/** PATCH update terminal configuration */
router.patch('/terminals/:id', validate(UpdateTerminalSchema), async (req, res) => {
    const { id } = req.params;
    const data = req.body; // Contains fields to update

    try {
        const updatedTerminal = await prisma.terminal.update({
            where: { id },
            data: data, // Prisma handles partial updates and `updatedAt` field automatically
        });

        res.status(200).json({ status: 'success', data: updatedTerminal });
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle Prisma-specific error, such as when a record is not found
            if (error.code === 'P2025') {
                return res.status(404).json({ status: 'fail', message: 'Terminal not found' });
            }
        }

        // Handle other types of errors (e.g., general errors)
        if (error instanceof Error) {
            console.error('Failed to update terminal:', error.message);
            res.status(500).json({ status: 'error', message: 'Failed to update terminal' });
        } else {
            console.error('An unknown error occurred:', error);
            res.status(500).json({ status: 'error', message: 'Failed to update terminal' });
        }
    }
});

export default router;
