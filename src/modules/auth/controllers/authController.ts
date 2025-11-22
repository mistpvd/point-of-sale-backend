import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { LoginSchema } from '../schemas/loginSchema';
import { RegisterSchema } from '../schemas/registerSchema';
import { z } from 'zod';

export const loginHandler = async (req: Request, res: Response) => {
    try {
        const input = LoginSchema.parse(req.body);

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: input.usernameOrEmail },
                    { email: input.usernameOrEmail }
                ],
                isActive: true,
            },
            include: { store: true },
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(input.password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const accessToken = jwt.sign(
            {
                sub: user.id,
                role: user.role,
                storeId: user.storeId,
                username: user.username,
            },
            process.env.JWT_SECRET!,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { sub: user.id },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: '7d' }
        );

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        return res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                storeId: user.storeId,
            },
        });
    } catch (err: unknown) {
        console.error('Login error:', err);
        if (err instanceof z.ZodError) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: err.issues.map((e: z.ZodIssue) => ({
                    path: e.path.join('.'),
                    message: e.message,
                })),
            });
        }
        return res.status(400).json({ message: 'Invalid input or internal error' });
    }
};

export const registerHandler = async (req: Request, res: Response) => {
    try {
        const input = RegisterSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({
            where: { email: input.email },
        });

        if (existingUser) {
            return res.status(409).json({ message: 'A user with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(input.password, salt);

        const result = await prisma.$transaction(async (tx) => {
            const newStore = await tx.store.create({
                data: {
                    name: input.businessName,
                    location: 'Initial Location',
                },
            });

            const newUser = await tx.user.create({
                data: {
                    username: input.fullName,
                    email: input.email,
                    passwordHash,
                    role: 'ADMIN',
                    storeId: newStore.id,
                    isActive: true,
                },
            });

            return { newUser };
        });

        return res.status(201).json({
            message: 'Account created successfully. Please sign in.',
            userId: result.newUser.id,
            email: result.newUser.email,
        });
    } catch (err: unknown) {
        console.error('Registration error:', err);

        if (err instanceof z.ZodError) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: err.issues.map((e: z.ZodIssue) => ({
                    path: e.path.join('.'),
                    message: e.message,
                })),
            });
        }

        return res.status(500).json({ message: 'Internal server error during registration' });
    }
};
