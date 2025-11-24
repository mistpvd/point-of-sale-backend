// src/index.ts

import express from 'express';
import dotenv from 'dotenv';
import { errorHandler } from './modules/products/middleware/errorHandler'; // adjust if you move errorHandler later
import productRoutes from './modules/products/routes/productRoutes';
import authRoutes from './modules/auth/routes/auth';
import userRoutes from './modules/settings/user/routes/userRoutes';
import storeRoutes from './modules/settings/store/routes/storeRoutes';
import stockRoutes from './modules/inventory/routes/stockRoutes';
import locationRoutes from './modules/inventory/locations/routes/locationRoutes';
import checkoutRoutes from "./modules/pos/checkout/routes/checkoutRoutes";

// 1. the cors library
import cors from 'cors';
import settingsRoutes from "./modules/settings/routes/settingsRoutes";
import terminalRoutes from "./modules/settings/routes/terminalRoutes";

const app = express();
const PORT = process.env.PORT || 7000;

dotenv.config();

//  2. Define the allowed origin (your frontend's URL)
const corsOptions = {
    origin: 'http://localhost:5173', // Only allow requests from your frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

//  3. Apply the CORS middleware here, on the app that is running
app.use(cors(corsOptions));

// Must be applied after cors() and before routes
app.use(express.json());

// ✅ Mount the product schemas
app.use('/api/v1/products', productRoutes);

// ✅Auth
app.use('/api/v1/auth', authRoutes);

// ✅User
app.use('/api/v1/users', userRoutes);

// ✅Store
app.use('/api/v1/store', storeRoutes);

// ✅Stock
app.use('/api/v1/stock', stockRoutes);

//Settings
app.use("/api/v1", settingsRoutes);

//Terminal
app.use("/api/v1", terminalRoutes);

// ✅Locations
app.use('/api/v1/locations', locationRoutes);

// Checkout
app.use('/api/v1', checkoutRoutes);

// ✅ Centralized error handler
app.use(errorHandler);

app.get('/https://point-of-sale-client-git-main-devmists-projects.vercel.app/', (req, res) => {
    res.send(`<h1>This is the Point of Sale</h1>`);
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
