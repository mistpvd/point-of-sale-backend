import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import {
    productSchema,
    productUpdateSchema,
    uuidParamSchema,
    paginationQuerySchema
} from "../schemas/productSchema";
import { z } from "zod";
import { toProductResponse } from "../utils/mapper";

// ✅ GET /products
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = "1", limit = "20", name } = paginationQuerySchema.parse(req.query);

        const products = await prisma.product.findMany({
            where: {
                ...(name && {
                    name: {
                        contains: String(name),
                        mode: "insensitive",
                    },
                }),
            },
            orderBy: { name: "asc" },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            include: {
                dimensions: true,
                stockBalances: true, // ✅ include stock per location
            },
        });

        const totalCount = await prisma.product.count({
            where: {
                ...(name && {
                    name: {
                        contains: String(name),
                        mode: "insensitive",
                    },
                }),
            },
        });

        // ✅ Compute total stock dynamically
        const result = products.map((p) => {
            const totalStock = p.stockBalances.reduce(
                (sum, s) => sum + s.on_hand_qty,
                0
            );

            return {
                ...toProductResponse(p),
                totalStock,
                status: totalStock > 0 ? "In Stock" : "Out of Stock",
            };
        });

        res.status(200).json({
            data: result,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: totalCount,
                totalPages: Math.ceil(totalCount / Number(limit)),
            },
        });
    } catch (err) {
        next(err);
    }
};

// ✅ POST /products
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data: z.infer<typeof productSchema> = productSchema.parse(req.body);
        const { dimensions, images, ...rest } = data;

        const newProduct = await prisma.product.create({
            data: {
                ...rest,
                imageUrls: images?.length ? images : undefined,
                isInStock: data.isInStock ?? true,
            },
        });

        if (
            dimensions &&
            typeof dimensions.length === "number" &&
            typeof dimensions.width === "number" &&
            typeof dimensions.height === "number"
        ) {
            await prisma.dimension.create({
                data: {
                    length: dimensions.length,
                    width: dimensions.width,
                    height: dimensions.height,
                    productId: newProduct.id,
                },
            });
        }

        const fullProduct = await prisma.product.findUnique({
            where: { id: newProduct.id },
            include: { dimensions: true },
        });

        res.status(201).json(toProductResponse(fullProduct!));
    } catch (err) {
        next(err);
    }
};

// ✅ PUT /products/:id
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = uuidParamSchema.parse(req.params);
        const data: z.infer<typeof productUpdateSchema> = productUpdateSchema.parse(req.body);
        const { dimensions, images, ...rest } = data;

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                ...rest,
                ...(images && { imageUrls: images }),
                ...(data.isInStock !== undefined && { isInStock: data.isInStock }),
            },
        });

        if (
            dimensions &&
            typeof dimensions.length === "number" &&
            typeof dimensions.width === "number" &&
            typeof dimensions.height === "number"
        ) {
            const existingDimension = await prisma.dimension.findUnique({
                where: { productId: id },
            });

            if (existingDimension) {
                await prisma.dimension.update({
                    where: { productId: id },
                    data: {
                        length: dimensions.length,
                        width: dimensions.width,
                        height: dimensions.height,
                    },
                });
            } else {
                await prisma.dimension.create({
                    data: {
                        length: dimensions.length,
                        width: dimensions.width,
                        height: dimensions.height,
                        productId: id,
                    },
                });
            }
        }

        const fullProduct = await prisma.product.findUnique({
            where: { id },
            include: { dimensions: true },
        });

        res.status(200).json(toProductResponse(fullProduct!));
    } catch (err) {
        next(err);
    }
};

// ✅ DELETE /products/:id — Soft Delete
export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = uuidParamSchema.parse(req.params);

        await prisma.product.update({
            where: { id },
            data: { isInStock: false },
        });

        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

// ✅ PATCH /products/:id/status — Reactivate/Deactivate
export const toggleProductStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = uuidParamSchema.parse(req.params);
        const { isInStock } = z.object({ isInStock: z.boolean() }).parse(req.body);

        await prisma.product.update({
            where: { id },
            data: { isInStock },
        });

        const fullProduct = await prisma.product.findUnique({
            where: { id },
            include: { dimensions: true },
        });

        res.status(200).json(toProductResponse(fullProduct!));
    } catch (err) {
        next(err);
    }
};
