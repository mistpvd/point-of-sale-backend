// scripts/refreshAllProductStocks.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function refreshAllProducts() {
    const products = await prisma.product.findMany({ select: { id: true } });

    console.log(`Refreshing total_stock for ${products.length} products...`);

    for (const { id } of products) {
        const total = await prisma.stockBalance.aggregate({
            where: { product_id: id },
            _sum: { available_qty: true },
        });
        const totalStock = total._sum.available_qty ?? 0;

        await prisma.product.update({
            where: { id },
            data: {
                total_stock: totalStock,
                isInStock: totalStock > 0,
            },
        });
    }

    console.log("✅ All product totals refreshed.");
}

refreshAllProducts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
