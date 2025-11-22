-- Add image, category, and slug fields to Product table
ALTER TABLE "products" ADD COLUMN "image" TEXT;
ALTER TABLE "products" ADD COLUMN "category" TEXT;
ALTER TABLE "products" ADD COLUMN "slug" TEXT;
