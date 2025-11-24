import express from 'express';
import dotenv from 'dotenv';
const cors = require('cors');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

(async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server failed to start:", err);
  }
})();


// You can define your schemas here
// app.use('/api/v1/products', productRoutes);

export default app;
