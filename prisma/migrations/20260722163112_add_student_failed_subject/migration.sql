-- CreateTable
CREATE TABLE "StudentFailedSubject" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "sectionId" INTEGER,
    "levelSubjectId" INTEGER NOT NULL,
    "finalScore" INTEGER,
    "date" TIMESTAMP(3),

    CONSTRAINT "StudentFailedSubject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentFailedSubject_studentId_idx" ON "StudentFailedSubject"("studentId");

-- CreateIndex
CREATE INDEX "StudentFailedSubject_sectionId_idx" ON "StudentFailedSubject"("sectionId");

-- CreateIndex
CREATE INDEX "StudentFailedSubject_levelSubjectId_idx" ON "StudentFailedSubject"("levelSubjectId");

-- AddForeignKey
ALTER TABLE "StudentFailedSubject" ADD CONSTRAINT "StudentFailedSubject_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFailedSubject" ADD CONSTRAINT "StudentFailedSubject_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFailedSubject" ADD CONSTRAINT "StudentFailedSubject_levelSubjectId_fkey" FOREIGN KEY ("levelSubjectId") REFERENCES "LevelSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
