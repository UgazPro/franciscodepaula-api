-- DropTable
DROP TABLE "ReportCard";

-- CreateTable
CREATE TABLE "SchoolStudentHistory" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "highSchoolLevelId" INTEGER NOT NULL,
    "schoolName" TEXT,
    "schoolState" TEXT,
    "schoolCity" TEXT,
    "schoolYear" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolStudentHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SchoolStudentHistory" ADD CONSTRAINT "SchoolStudentHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolStudentHistory" ADD CONSTRAINT "SchoolStudentHistory_highSchoolLevelId_fkey" FOREIGN KEY ("highSchoolLevelId") REFERENCES "HighSchoolLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
