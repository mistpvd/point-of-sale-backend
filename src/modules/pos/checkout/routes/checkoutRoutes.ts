// src/routes/api.ts

import express from 'express';
import checkoutController from '../controllers/checkoutController';
import { getProducts } from '../../../products/controllers/productController';


const router = express.Router();

// Existing route for product fetching

router.get('/products', getProducts);

// ✅ NEW CHECKOUT ROUTE
router.post(
    '/checkout',
    checkoutController.validateCheckout, // 1. Validate data structure
    checkoutController.checkout          // 2. Process transaction
);

export default router;