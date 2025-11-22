import express from 'express';
import productRoutes from './routes/productRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json());

// Product schemas with versioned API
app.use('/api/v1/products', productRoutes);

// Error handler should be the last middleware
app.use(errorHandler);

export default app;
