// src/schemas/productRoutes.ts
import { Router } from 'express';
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController';

const router = Router();

// GET /api/v1/products
router.get('/', getProducts);

// POST /api/v1/products
router.post('/', createProduct);

// PUT /api/v1/products/:id
router.put('/:id', updateProduct);

// DELETE /api/v1/products/:id (Soft delete)
router.delete('/:id', deleteProduct);

export default router;
