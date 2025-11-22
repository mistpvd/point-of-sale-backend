import { Router } from "express";
import prisma from "../utils/prisma";
import { validate } from "../middleware/validate";
import {
    UpdateUserStatusSchema,
    CreateUserSchema,
    UpdateUserRoleSchema
} from "../schemas/settingsSchema";

import bcrypt from "bcryptjs";

async function hashPin(pin: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(pin, salt);
}

const router = Router();

/**
 * POST /users  - Create User
 */
router.post("/users", validate(CreateUserSchema), async (req, res) => {
    const { name, email, pin, role, storeId } = req.body;

    try {
        const hashedPin = await hashPin(pin);

        const newUser = await prisma.user.create({
            data: {
                username: name,
                email,
                passwordHash: hashedPin,
                role,
                storeId                // ✅ REQUIRED BY PRISMA USER MODEL
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                isActive: true,
                storeId: true
            }
        });

        return res.status(201).json({
            status: "success",
            message: "User created successfully",
            data: newUser
        });

    } catch (error: any) {

        if (error.code === "P2002") {
            return res.status(409).json({
                status: "fail",
                message: "User with this email or username already exists"
            });
        }

        console.error("User creation failed:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to create user"
        });
    }
});

/**
 * GET /users  - List users
 */
router.get("/users", async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { username: "asc" },
            select: {
                id: true,
                username: true,
                email: true,
                passwordHash: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                storeId: true
            }
        });

        const formatted = users.map((u) => ({
            id: u.id,
            name: u.username,
            email: u.email,
            role: u.role,
            status: u.isActive ? "active" : "inactive",
            last_login: u.lastLoginAt,
            storeId: u.storeId
        }));

        return res.status(200).json({
            status: "success",
            data: formatted
        });

    } catch (error) {
        console.error("Failed to fetch users:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch users"
        });
    }
});

/**
 * PATCH /users/:id/status  - Activate/Deactivate user
 */
router.patch("/users/:id/status", validate(UpdateUserStatusSchema), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const isActive = status === "active";

    try {
        const updated = await prisma.user.update({
            where: { id },
            data: { isActive },
            select: {
                id: true,
                username: true,
                isActive: true
            }
        });

        return res.status(200).json({
            status: "success",
            data: {
                id: updated.id,
                name: updated.username,
                status: updated.isActive ? "active" : "inactive"
            }
        });

    } catch (error: any) {
        if (error.code === "P2025") {
            return res.status(404).json({
                status: "fail",
                message: "User not found"
            });
        }

        console.error("Failed to update user status:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to update user status"
        });
    }
});

/**
 * PATCH /users/:id/role - Change Role
 */
router.patch("/users/:id/role", validate(UpdateUserRoleSchema), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    try {
        const updated = await prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                username: true,
                role: true
            }
        });

        return res.status(200).json({
            status: "success",
            data: updated
        });

    } catch (error: any) {
        if (error.code === "P2025") {
            return res.status(404).json({
                status: "fail",
                message: "User not found"
            });
        }

        console.error("Failed to update user role:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to update user role"
        });
    }
});

/**
 * GET /roles - Return enum values
 */
router.get("/roles", async (req, res) => {
    const roles = await prisma.$queryRawUnsafe(`SELECT unnest(enum_range(NULL::"Role"));`);
    res.status(200).json({ status: "success", data: roles });
});

export default router;
