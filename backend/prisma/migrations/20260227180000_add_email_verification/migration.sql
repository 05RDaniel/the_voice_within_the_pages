-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "emailVerificationToken" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerificationTokenExpiresAt" TIMESTAMP(3);

-- Usuarios existentes se consideran ya verificados
UPDATE "User" SET "emailVerified" = true WHERE "emailVerified" = false AND "emailVerificationToken" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "User"("emailVerificationToken");
CREATE INDEX "User_emailVerificationToken_idx" ON "User"("emailVerificationToken");
