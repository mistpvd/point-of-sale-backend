import express from 'express';
import dotenv from 'dotenv';
const cors = require('cors');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());


// You can define your schemas here
// app.use('/api/v1/products', productRoutes);

export default app;
