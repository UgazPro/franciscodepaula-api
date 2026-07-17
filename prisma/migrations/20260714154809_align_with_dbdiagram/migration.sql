/*
  Warnings:

  - You are about to drop the column `highSchoolLevelId` on the `SchoolStudentHistory` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "SchoolStudentHistory" DROP CONSTRAINT "SchoolStudentHistory_highSchoolLevelId_fkey";

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "countryId" INTEGER;

-- AlterTable
ALTER TABLE "SchoolStudentHistory" DROP COLUMN "highSchoolLevelId",
ADD COLUMN     "finalScore" DECIMAL(10,2),
ADD COLUMN     "levelSubjectId" INTEGER,
ADD COLUMN     "schoolYear" INTEGER;

-- AlterTable
ALTER TABLE "StudentFailedSubject" ALTER COLUMN "typeOf" SET DATA TYPE VARCHAR(2);

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolStudentHistory" ADD CONSTRAINT "SchoolStudentHistory_levelSubjectId_fkey" FOREIGN KEY ("levelSubjectId") REFERENCES "LevelSubject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
