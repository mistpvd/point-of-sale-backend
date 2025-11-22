-- CreateTable
CREATE TABLE "stock_moves" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "from_location_id" UUID,
    "to_location_id" UUID,
    "qty" INTEGER NOT NULL,
    "unit_cost" DECIMAL(10,2),
    "reason" TEXT NOT NULL,
    "ref_type" TEXT,
    "ref_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_moves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_moves_product_id_created_at_idx" ON "stock_moves"("product_id", "created_at");

-- AddForeignKey
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
