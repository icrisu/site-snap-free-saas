/*
  Warnings:

  - You are about to drop the column `key` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Settings` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Settings_key_key";

-- AlterTable
ALTER TABLE "Settings" DROP COLUMN "key",
DROP COLUMN "value",
ADD COLUMN     "data" JSONB NOT NULL DEFAULT '{}';
