/*
  Warnings:

  - You are about to alter the column `score` on the `GradeRecord` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `Integer`.
  - You are about to drop the column `schoolCountry` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `schoolYear` on the `SchoolStudentHistory` table. All the data in the column will be lost.
  - You are about to drop the `StudentFailedSubject` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StudentFailedSubject" DROP CONSTRAINT "StudentFailedSubject_levelSubjectId_fkey";

-- DropForeignKey
ALTER TABLE "StudentFailedSubject" DROP CONSTRAINT "StudentFailedSubject_studentId_fkey";

-- AlterTable
ALTER TABLE "GradeRecord" ALTER COLUMN "score" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "School" DROP COLUMN "schoolCountry";

-- AlterTable
ALTER TABLE "SchoolStudentHistory" DROP COLUMN "schoolYear",
ADD COLUMN     "approvalDate" TIMESTAMP(3),
ADD COLUMN     "schoolYearId" INTEGER,
ADD COLUMN     "sectionId" INTEGER,
ADD COLUMN     "status" BOOLEAN,
ADD COLUMN     "typeOf" VARCHAR(1);

-- DropTable
DROP TABLE "StudentFailedSubject";

-- CreateIndex
CREATE INDEX "SchoolStudentHistory_studentId_idx" ON "SchoolStudentHistory"("studentId");

-- CreateIndex
CREATE INDEX "SchoolStudentHistory_schoolId_idx" ON "SchoolStudentHistory"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolStudentHistory_sectionId_idx" ON "SchoolStudentHistory"("sectionId");

-- CreateIndex
CREATE INDEX "SchoolStudentHistory_schoolYearId_idx" ON "SchoolStudentHistory"("schoolYearId");

-- AddForeignKey
ALTER TABLE "SchoolStudentHistory" ADD CONSTRAINT "SchoolStudentHistory_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolStudentHistory" ADD CONSTRAINT "SchoolStudentHistory_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
