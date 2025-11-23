-- CreateTable
CREATE TABLE "order_temp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_temp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_temp_email_idx" ON "order_temp"("email");