/*
  Warnings:

  - You are about to drop the column `resetTokenExpires` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_resetToken_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "resetTokenExpires",
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);
