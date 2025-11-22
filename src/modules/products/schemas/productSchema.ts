import { z } from "zod";

// Shared validators
const uuid = z.string().uuid();
const decimal = z.number().nonnegative().multipleOf(0.01); // allow 0.00

export const productSchema = z.object({
    id: uuid.optional(),
    sku: z.string().min(1).regex(/^[A-Z0-9-]+$/, "Invalid SKU format"),
    barcode: z.string().regex(/^\d+$/, "Barcode must be numeric").optional(),
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    price: decimal,
    categoryId: uuid.optional(),
    uom: z.string().max(50).optional(),

    // ✅ Support single or multiple images
    image: z.string().url().optional(),
    images: z.array(z.string().url()).optional(),

    // ✅ Stock
    total_stock: z.number().int().nonnegative().default(0),
    isInStock: z.boolean().default(true),

    // ✅ Meta
    tax_rate: z.number().max(100).optional(),
    discount: z.number().max(100).optional(),
    weight: z.number().positive().optional(),

    // ✅ Dimensions (optional group)
    dimensions: z
        .object({
            length: z.number().positive(),
            width: z.number().positive(),
            height: z.number().positive(),
        })
        .optional(),

    status: z.enum(["ACTIVE", "DISCONTINUED", "PENDING"]).default("ACTIVE"),
});

// ✅ For PATCH/PUT updates
export const productUpdateSchema = productSchema.partial();

// ✅ URL param validator
export const uuidParamSchema = z.object({
    id: uuid,
});

// ✅ Query params
export const paginationQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    name: z.string().optional(),
});
