import { Product } from "@prisma/client";

export const toProductResponse = (product: Product) => ({
    ...product,
    isActive: product.is_active,
});
