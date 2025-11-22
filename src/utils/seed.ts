
import { PrismaClient, Prisma } from "@prisma/client";
import { productSchema } from "../modules/products/schemas/productSchema";

const prisma = new PrismaClient();


// src/utils/seed.ts (Corrected mockProducts array)

const mockProducts = [
    {
        sku: "SFJ-001",
        barcode: "1234567890123", // Unique
        name: "Slim Fit Jeans",
        category: "Men's Clothing",
        price: 49.99,
        stockQuantity: 30,
        image: "https://example.com/images/slim-fit-jeans.jpg",
        description: "Stylish and comfortable slim-fit jeans for daily wear.",
        isActive: true,
    },
    {
        sku: "LJ-002",
        barcode: "2345678901234", // Unique
        name: "Leather Jacket",
        category: "Men's Clothing",
        price: 99.99,
        stockQuantity: 20,
        image: "https://example.com/images/leather-jacket.jpg",
        description: "Premium leather jacket, perfect for cold weather and a bold style.",
        isActive: true,
    },
    {
        sku: "GT-003",
        barcode: "3456789012345", // Unique
        name: "Graphic T-Shirt",
        category: "Men's Clothing",
        price: 19.99,
        stockQuantity: 50,
        image: "https://example.com/images/graphic-t-shirt.jpg",
        description: "Comfortable graphic t-shirt with unique designs.",
        isActive: true,
    },
    {
        sku: "CPS-004",
        barcode: "4567890123456", // Unique
        name: "Cotton Polo Shirt",
        category: "Men's Clothing",
        price: 25.00,
        stockQuantity: 40,
        image: "https://example.com/images/cotton-polo-shirt.jpg",
        description: "Soft and breathable cotton polo shirt for casual outings.",
        isActive: true,
    },
    {
        sku: "WPJ-005",
        barcode: "5678901234567", // Unique
        name: "Winter Parka Jacket",
        category: "Men's Clothing",
        price: 120.00,
        stockQuantity: 15,
        image: "https://example.com/images/winter-parka-jacket.jpg",
        description: "Heavy-duty winter parka to keep you warm during the coldest months.",
        isActive: true,
    },
    {
        sku: "CP-006",
        barcode: "6789012345678", // Unique
        name: "Chinos Pants",
        category: "Men's Clothing",
        price: 39.99,
        stockQuantity: 45,
        image: "https://example.com/images/chinos-pants.jpg",
        description: "Classic chinos for a relaxed but stylish look.",
        isActive: true,
    },
    {
        sku: "CS-007",
        barcode: "7890123456789", // Unique
        name: "Casual Sneakers",
        category: "Footwear",
        price: 59.99,
        stockQuantity: 60,
        image: "https://example.com/images/casual-sneakers.jpg",
        description: "Comfortable sneakers for everyday use, with a modern design.",
        isActive: true,
    },
    {
        sku: "SDB-008",
        barcode: "8901234567890", // Unique
        name: "Suede Desert Boots",
        category: "Footwear",
        price: 89.99,
        stockQuantity: 25,
        image: "https://example.com/images/suede-desert-boots.jpg",
        description: "Classic desert boots made from high-quality suede.",
        isActive: true,
    },
    {
        sku: "PV-009",
        barcode: "9012345678901", // Unique
        name: "Puffer Vest",
        category: "Men's Clothing",
        price: 79.99,
        stockQuantity: 20,
        image: "https://example.com/images/puffer-vest.jpg",
        description: "Stylish puffer vest for extra warmth without the bulk.",
        isActive: true,
    },
    {
        sku: "DJ-010",
        barcode: "0123456789012", // Unique
        name: "Denim Jacket",
        category: "Men's Clothing",
        price: 69.99,
        stockQuantity: 35,
        image: "https://example.com/images/denim-jacket.jpg",
        description: "Classic denim jacket with a timeless design.",
        isActive: true,
    },
    {
        sku: "MD-011",
        barcode: "1234567890130", // **FIXED** (was 1234567890123)
        name: "Maxi Dress",
        category: "Women's Clothing",
        price: 49.99,
        stockQuantity: 30,
        image: "https://example.com/images/maxi-dress.jpg",
        description: "Elegant maxi dress perfect for both casual and formal events.",
        isActive: true,
    },
    {
        sku: "FSD-012",
        barcode: "2345678901241", // **FIXED** (was 2345678901234)
        name: "Floral Summer Dress",
        category: "Women's Clothing",
        price: 39.99,
        stockQuantity: 50,
        image: "https://example.com/images/floral-summer-dress.jpg",
        description: "Light and breezy summer dress with a vibrant floral pattern.",
        isActive: true,
    },
    {
        sku: "LH-013",
        barcode: "3456789012352", // **FIXED** (was 3456789012345)
        name: "Leather Handbag",
        category: "Accessories",
        price: 129.99,
        stockQuantity: 15,
        image: "https://example.com/images/leather-handbag.jpg",
        description: "Sleek leather handbag that complements any outfit.",
        isActive: true,
    },
    {
        sku: "RTT-014",
        barcode: "4567890123463", // **FIXED** (was 4567890123456)
        name: "Racerback Tank Top",
        category: "Women's Clothing",
        price: 14.99,
        stockQuantity: 60,
        image: "https://example.com/images/racerback-tank-top.jpg",
        description: "Comfortable and stylish racerback tank top for summer.",
        isActive: true,
    },
    {
        sku: "WLP-015",
        barcode: "5678901234574", // **FIXED** (was 5678901234567)
        name: "Wide-Legged Pants",
        category: "Women's Clothing",
        price: 44.99,
        stockQuantity: 35,
        image: "https://example.com/images/wide-legged-pants.jpg",
        description: "Flowy, comfortable wide-legged pants perfect for casual wear.",
        isActive: true,
    },
    {
        sku: "SB-016",
        barcode: "6789012345685", // **FIXED** (was 6789012345678)
        name: "Satin Blouse",
        category: "Women's Clothing",
        price: 49.99,
        stockQuantity: 40,
        image: "https://example.com/images/satin-blouse.jpg",
        description: "Elegant satin blouse with a smooth finish, perfect for work or dinner.",
        isActive: true,
    },
    {
        sku: "HWS-017",
        barcode: "7890123456796", // **FIXED** (was 7890123456789)
        name: "High-Waisted Skirt",
        category: "Women's Clothing",
        price: 29.99,
        stockQuantity: 45,
        image: "https://example.com/images/high-waisted-skirt.jpg",
        description: "Trendy high-waisted skirt, ideal for both casual and semi-formal outfits.",
        isActive: true,
    },
    {
        sku: "CKS-018",
        barcode: "8901234568007", // **FIXED** (was 8901234567890)
        name: "Chunky Knit Sweater",
        category: "Women's Clothing",
        price: 59.99,
        stockQuantity: 25,
        image: "https://example.com/images/chunky-knit-sweater.jpg",
        description: "Cozy chunky knit sweater perfect for chilly weather.",
        isActive: true,
    },
    {
        sku: "BF-019",
        barcode: "9012345678918", // **FIXED** (was 9012345678901)
        name: "Ballet Flats",
        category: "Footwear",
        price: 39.99,
        stockQuantity: 30,
        image: "https://example.com/images/ballet-flats.jpg",
        description: "Comfortable ballet flats that go with any casual or formal outfit.",
        isActive: true,
    },
    {
        sku: "CPS-020",
        barcode: "0123456789029", // **FIXED** (was 0123456789012)
        name: "Cozy Pajama Set",
        category: "Loungewear",
        price: 34.99,
        stockQuantity: 50,
        image: "https://example.com/images/cozy-pajama-set.jpg",
        description: "Soft and comfortable pajama set for ultimate relaxation.",
        isActive: true,
    },
];




const getOrCreateCategory = async (name: string): Promise<string> => {
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) return existing.id;

    const created = await prisma.category.create({
        data: { name },
    });
    return created.id;
};

const seedProducts = async () => {
    try {
        // Clear stock balances first (dependent on products)
        await prisma.stockBalance.deleteMany({});
        console.log("🗑️ Cleared all stock balances.");

        // Clear products
        await prisma.product.deleteMany({});
        console.log("🗑️ Cleared all products.");

        const defaultLocation = await prisma.location.findFirst();

        if (!defaultLocation) {
            console.warn("⚠️ No default location found. Skipping stock balance creation.");
        }

        for (const product of mockProducts) {
            try {
                const categoryId = await getOrCreateCategory(product.category);

                // Build product input for validation (match schema)
                const productInput = {
                    sku: product.sku,
                    barcode: product.barcode,
                    name: product.name,
                    price: product.price,
                    description: product.description,
                    image: product.image, // temporary for validation
                    isActive: product.isActive,
                };

                // Validate against zod schema
                const validated = productSchema.parse(productInput);

                // Prepare data for Prisma (match model)
                const prismaProductData: Prisma.ProductCreateInput = {
                    sku: validated.sku,
                    barcode: validated.barcode,
                    name: validated.name,
                    price: new Prisma.Decimal(validated.price),
                    description: validated.description,
                    imageUrls: validated.image ? [validated.image] : [],
                    isInStock: validated.isActive ?? true,
                    category: {
                        connect: { id: categoryId },
                    },
                };

                const createdProduct = await prisma.product.create({
                    data: prismaProductData,
                });

                console.log(`✅ Product ${product.name} created.`);

                // Create stock balance if location exists
                if (defaultLocation) {
                    await prisma.stockBalance.create({
                        data: {
                            product_id: createdProduct.id,
                            location_id: defaultLocation.id,
                            on_hand_qty: product.stockQuantity || 0,
                            available_qty: product.stockQuantity || 0,
                            committed_qty: 0,
                        },
                    });
                    console.log(`↳ Stock balance created at location: ${defaultLocation.name}`);
                }
            } catch (error) {
                console.error(`❌ Error creating product ${product.name}:`, error);
            }
        }
    } catch (err) {
        console.error("❌ Unexpected error during product seeding:", err);
    } finally {
        await prisma.$disconnect();
    }
};

seedProducts();
