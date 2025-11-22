// src/schemas/settingsSchema.ts

import { z } from 'zod';

// --- Base Types/Enums ---
const StatusEnum = z.enum(["active", "inactive"]);
const TerminalStatusEnum = z.enum(["online", "offline"]);
const PermissionEnum = z.enum([
    "sales",
    "inventory",
    "reports",
    "customers",
    "settings",
    "users",
    "all" // For Admin role
]);

// --- User Schemas (Updated) ---
// Add the CreateUserSchema
export const CreateUserSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    pin: z.string().regex(/^\d{4,10}$/, "PIN must be 4-10 digits."),
    role_id: z.string().uuid(), // FK to roles table
    // Note: status is defaulted to 'active' on creation, isActive is assumed.
});

// --- Role Schemas ---
export const RoleSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2).max(50),
    permissions: z.array(PermissionEnum).min(1),
});

export const UpdateRoleSchema = z.object({
    name: z.string().min(2).max(50).optional(),
    permissions: z.array(PermissionEnum).min(1).optional(),
});


// --- User Schemas ---
export const UserSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2).max(100),
    email: z.string().email(),
    pin: z.string().regex(/^\d{4,10}$/, "PIN must be 4-10 digits."),
    status: StatusEnum,
    role_id: z.string().uuid(), // FK to roles table
    last_login: z.string().datetime().nullable(),
});

export const UpdateUserStatusSchema = z.object({
    status: StatusEnum,
});

export const UpdateUserRoleSchema = z.object({
    role_id: z.string().uuid(),
});


// --- Store Schemas ---
export const StoreSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2).max(100),
    address: z.string().min(5),
    phone: z.string().max(20).optional(),
    tax_id: z.string().max(50).optional(),
    currency: z.string().max(10),
    timezone: z.string().max(50),
});

export const UpdateStoreSchema = StoreSchema.partial().extend({
    // Ensure ID is present for update operations
    id: z.string().uuid(),
});


// --- Terminal Schemas ---
export const TerminalSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2).max(100),
    location: z.string().max(100).optional(),
    printer: z.string().max(100).optional(),
    cash_drawer: z.boolean(),
    status: TerminalStatusEnum,
    store_id: z.string().uuid(), // FK to stores table
});

export const UpdateTerminalSchema = TerminalSchema.partial().extend({
    id: z.string().uuid(),
});