/*
  Warnings:

  - Added the required column `cashier_id` to the `sales_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_method` to the `sales_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sales_transactions" ADD COLUMN     "cashier_id" UUID NOT NULL,
ADD COLUMN     "discount_applied" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "payment_method" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
