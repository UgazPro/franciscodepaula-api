-- Step 0: Check if migration already partially applied
DO $$
BEGIN
  -- Drop old columns if they still exist (in case of partial failure)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'StudentFailedSubject' AND column_name = 'sectionId') THEN
    -- Revert to clean state
    ALTER TABLE "StudentFailedSubject" DROP CONSTRAINT IF EXISTS "StudentFailedSubject_teachingGroupId_fkey";
    ALTER TABLE "StudentFailedSubject" DROP COLUMN IF EXISTS "teachingGroupId";
    ALTER TABLE "StudentFailedSubject" DROP COLUMN IF EXISTS "status";
    ALTER TABLE "StudentFailedSubject" DROP COLUMN IF EXISTS "createdAt";
  END IF;
  DROP TABLE IF EXISTS "StudentFailedSubjectAttempt";
END $$;

-- CreateTable: StudentFailedSubjectAttempt
CREATE TABLE "StudentFailedSubjectAttempt" (
    "id" SERIAL NOT NULL,
    "studentFailedSubjectsId" INTEGER NOT NULL,
    "score" INTEGER,
    "evaluationDate" TIMESTAMP(3),
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER,

    CONSTRAINT "StudentFailedSubjectAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentFailedSubjectAttempt_studentFailedSubjectsId_idx" ON "StudentFailedSubjectAttempt"("studentFailedSubjectsId");

-- Step 1: Add teachingGroupId as nullable
ALTER TABLE "StudentFailedSubject" ADD COLUMN "teachingGroupId" INTEGER;

-- Step 2: Add status and createdAt columns
ALTER TABLE "StudentFailedSubject" ADD COLUMN "status" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StudentFailedSubject" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 3: Migrate data using CTE to pick best matching TeachingGroup
-- Priority: exact match (levelSubjectId + sectionId), then any active TG with same levelSubjectId
WITH best_match AS (
  SELECT DISTINCT ON (sfs."id")
    sfs."id" AS sfs_id,
    tg."id" AS tg_id
  FROM "StudentFailedSubject" sfs
  JOIN "TeachingGroup" tg ON tg."levelSubjectId" = sfs."levelSubjectId"
  ORDER BY sfs."id",
    CASE WHEN tg."sectionId" = sfs."sectionId" THEN 0 ELSE 1 END,
    CASE WHEN tg."status" = true THEN 0 ELSE 1 END,
    tg."id" DESC
)
UPDATE "StudentFailedSubject" sfs
SET "teachingGroupId" = bm.tg_id
FROM best_match bm
WHERE sfs."id" = bm.sfs_id;

-- Step 4: Make teachingGroupId NOT NULL (after data migration)
ALTER TABLE "StudentFailedSubject" ALTER COLUMN "teachingGroupId" SET NOT NULL;

-- Step 5: Add FK constraint
ALTER TABLE "StudentFailedSubject" ADD CONSTRAINT "StudentFailedSubject_teachingGroupId_fkey"
  FOREIGN KEY ("teachingGroupId") REFERENCES "TeachingGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 6: Add FK constraint for StudentFailedSubjectAttempt
ALTER TABLE "StudentFailedSubjectAttempt" ADD CONSTRAINT "StudentFailedSubjectAttempt_studentFailedSubjectsId_fkey"
  FOREIGN KEY ("studentFailedSubjectsId") REFERENCES "StudentFailedSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 7: Drop old columns
ALTER TABLE "StudentFailedSubject" DROP COLUMN "sectionId";
ALTER TABLE "StudentFailedSubject" DROP COLUMN "levelSubjectId";
ALTER TABLE "StudentFailedSubject" DROP COLUMN "finalScore";
ALTER TABLE "StudentFailedSubject" DROP COLUMN "date";

-- Step 8: Recreate indexes
DROP INDEX IF EXISTS "StudentFailedSubject_studentId_idx";
DROP INDEX IF EXISTS "StudentFailedSubject_sectionId_idx";
DROP INDEX IF EXISTS "StudentFailedSubject_levelSubjectId_idx";
CREATE INDEX "StudentFailedSubject_studentId_idx" ON "StudentFailedSubject"("studentId");
CREATE INDEX "StudentFailedSubject_teachingGroupId_idx" ON "StudentFailedSubject"("teachingGroupId");
