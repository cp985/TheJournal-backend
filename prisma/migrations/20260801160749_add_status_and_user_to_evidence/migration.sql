/*
  Warnings:

  - Added the required column `author` to the `Evidence` table without a default value. This is not possible if the table is not empty.
  - Made the column `notes` on table `Evidence` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('PENDIG', 'REJECTED', 'ACCEPTED');

-- AlterTable
ALTER TABLE "Dossier" ADD COLUMN     "description_en" TEXT,
ADD COLUMN     "title_en" TEXT;

-- AlterTable
ALTER TABLE "Evidence" ADD COLUMN     "author" TEXT NOT NULL,
ADD COLUMN     "notes_en" TEXT,
ADD COLUMN     "status" "EvidenceStatus" NOT NULL DEFAULT 'PENDIG',
ALTER COLUMN "notes" SET NOT NULL;

-- AlterTable
ALTER TABLE "Timeline" ADD COLUMN     "description_en" VARCHAR(255),
ADD COLUMN     "title_en" TEXT;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_author_fkey" FOREIGN KEY ("author") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
