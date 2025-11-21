-- AlterTable
ALTER TABLE "users" ADD COLUMN     "currentTier" TEXT NOT NULL DEFAULT 'bronze',
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "totalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;