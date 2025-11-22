import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreateUserSchema } from '../schemas/createUserSchema';
import { ZodError } from 'zod';

const prisma = new PrismaClient();


// ✅ CREATE USER - POST /users
export const createUser = async (req: Request, res: Response) => {
    try {
        const input = CreateUserSchema.parse(req.body);

        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash(input.password, 10);

        const user = await prisma.user.create({
            data: {
                username: input.username,
                email: input.email,
                passwordHash,
                role: input.role,
                storeId: input.storeId,
            },
        });

        res.status(201).json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            storeId: user.storeId,
            createdAt: user.createdAt,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: error.issues });
        }

        console.error('Error creating user:', error);
        return res.status(500).json({ error: 'Failed to create user' });
    }
};


// ✅ GET ALL USERS - GET /users
export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: { store: true },
            orderBy: { username: 'asc' },
        });

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};


// ✅ UPDATE USER STATUS - PUT /users/:id
export const updateUserStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { isActive },
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};


// ✅ DEACTIVATE USER - PUT /users/:id/deactivate
export const deactivateUser = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const user = await prisma.user.update({
            where: { id },
            data: { isActive: false },
        });

        res.json({ message: 'User deactivated', user });
    } catch (error) {
        console.error('Error deactivating user:', error);
        res.status(500).json({ error: 'Failed to deactivate user' });
    }
};
