/*
  Warnings:

  - You are about to drop the column `hasProPlan` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `hasProPlanForFree` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `maxProjects` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `maxUploadMB` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "hasProPlan",
DROP COLUMN "hasProPlanForFree",
DROP COLUMN "maxProjects",
DROP COLUMN "maxUploadMB";
