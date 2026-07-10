-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'VES');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('BONUS', 'DEDUCTION');

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" SERIAL NOT NULL,
    "profilePhoto" TEXT,
    "firstNames" TEXT NOT NULL,
    "lastNames" TEXT NOT NULL,
    "identificationNumber" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "personId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "status" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "personId" INTEGER NOT NULL,
    "birthCountry" TEXT,
    "state" TEXT,
    "municipality" TEXT,
    "parish" TEXT,
    "currentParish" TEXT,
    "previousSchool" TEXT,
    "address" TEXT,
    "status" BOOLEAN,
    "admissionDate" TIMESTAMP(3),

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Representative" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "occupation" TEXT,

    CONSTRAINT "Representative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentRepresentative" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "representativeId" INTEGER NOT NULL,
    "relationship" TEXT,
    "isPrimary" BOOLEAN DEFAULT false,

    CONSTRAINT "StudentRepresentative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "baseHourRate" DECIMAL(10,2),
    "hireDate" TIMESTAMP(3),

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolYear" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Period" (
    "id" SERIAL NOT NULL,
    "schoolYearId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HighSchoolLevel" (
    "id" SERIAL NOT NULL,
    "level" TEXT NOT NULL,

    CONSTRAINT "HighSchoolLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" SERIAL NOT NULL,
    "schoolYearId" INTEGER NOT NULL,
    "highSchoolLevelId" INTEGER NOT NULL,
    "section" TEXT NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentEnrollment" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "schoolYearId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "enrollmentDate" TIMESTAMP(3),
    "paymentReferenceId" INTEGER,
    "status" BOOLEAN,

    CONSTRAINT "StudentEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "code" TEXT,
    "status" BOOLEAN,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelSubject" (
    "id" SERIAL NOT NULL,
    "highSchoolLevelId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,

    CONSTRAINT "LevelSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingGroup" (
    "id" SERIAL NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "levelSubjectId" INTEGER NOT NULL,
    "schoolYearId" INTEGER NOT NULL,
    "sectionId" INTEGER,
    "groupName" TEXT,
    "isSpecialGroup" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" BOOLEAN,

    CONSTRAINT "TeachingGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentTeachingGroup" (
    "id" SERIAL NOT NULL,
    "studentEnrollmentId" INTEGER NOT NULL,
    "teachingGroupId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentTeachingGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationType" (
    "id" SERIAL NOT NULL,
    "evaluationType" TEXT NOT NULL,

    CONSTRAINT "EvaluationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" SERIAL NOT NULL,
    "teachingGroupId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,
    "evaluationTypeId" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "objectives" TEXT,
    "percentage" DECIMAL(5,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeRecord" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "evaluationId" INTEGER NOT NULL,
    "score" DECIMAL(5,2),
    "observations" TEXT,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeRecord_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "StudentFailedSubject" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "levelSubjectId" INTEGER NOT NULL,
    "successDate" TIMESTAMP(3),
    "finalAverage" DECIMAL(5,2),
    "typeOf" VARCHAR(1),
    "status" VARCHAR(20),
    "observations" TEXT,

    CONSTRAINT "StudentFailedSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "State" (
    "id" SERIAL NOT NULL,
    "countryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Municipality" (
    "id" SERIAL NOT NULL,
    "stateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Municipality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parish" (
    "id" SERIAL NOT NULL,
    "municipalityId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Parish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentType" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,

    CONSTRAINT "PaymentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" SERIAL NOT NULL,
    "paymentTypeId" INTEGER NOT NULL,
    "bank" TEXT,
    "accountNumber" TEXT,
    "identification" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "owner" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fee" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "schoolYearId" INTEGER NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFee" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "feeId" INTEGER NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "status" BOOLEAN,

    CONSTRAINT "StudentFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exchange" (
    "id" SERIAL NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "payerName" TEXT,
    "payerIdentification" TEXT,
    "payerPhone" TEXT,
    "exchangeId" INTEGER,
    "description" TEXT,
    "status" BOOLEAN,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollPeriod" (
    "id" SERIAL NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" BOOLEAN,

    CONSTRAINT "PayrollPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeWorkHour" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "payrollPeriodId" INTEGER NOT NULL,
    "assignedHours" DECIMAL(8,2) NOT NULL,
    "approvedBy" INTEGER,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeWorkHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRecord" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "payrollPeriodId" INTEGER NOT NULL,
    "hourlyRate" DECIMAL(10,2),
    "workedHours" DECIMAL(8,2),
    "grossSalary" DECIMAL(12,2),
    "deductions" DECIMAL(12,2) DEFAULT 0,
    "bonuses" DECIMAL(12,2) DEFAULT 0,
    "netSalary" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'USD',
    "paymentStatus" TEXT DEFAULT 'pending',
    "paymentDate" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollAdjustment" (
    "id" SERIAL NOT NULL,
    "payrollRecordId" INTEGER NOT NULL,
    "type" "AdjustmentType" NOT NULL,
    "concept" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "PayrollAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_role_key" ON "Role"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_identificationNumber_key" ON "Person"("identificationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_personId_key" ON "User"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_personId_key" ON "Student"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Representative_userId_key" ON "Representative"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRepresentative_studentId_representativeId_key" ON "StudentRepresentative"("studentId", "representativeId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_schoolYearId_highSchoolLevelId_section_key" ON "Section"("schoolYearId", "highSchoolLevelId", "section");

-- CreateIndex
CREATE UNIQUE INDEX "StudentEnrollment_paymentReferenceId_key" ON "StudentEnrollment"("paymentReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "LevelSubject_highSchoolLevelId_subjectId_key" ON "LevelSubject"("highSchoolLevelId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingGroup_teacherId_levelSubjectId_schoolYearId_section_key" ON "TeachingGroup"("teacherId", "levelSubjectId", "schoolYearId", "sectionId", "groupName");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTeachingGroup_studentEnrollmentId_teachingGroupId_key" ON "StudentTeachingGroup"("studentEnrollmentId", "teachingGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeRecord_studentId_evaluationId_key" ON "GradeRecord"("studentId", "evaluationId");

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollPeriod_month_year_key" ON "PayrollPeriod"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeWorkHour_employeeId_payrollPeriodId_key" ON "EmployeeWorkHour"("employeeId", "payrollPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRecord_employeeId_payrollPeriodId_key" ON "PayrollRecord"("employeeId", "payrollPeriodId");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Representative" ADD CONSTRAINT "Representative_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRepresentative" ADD CONSTRAINT "StudentRepresentative_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRepresentative" ADD CONSTRAINT "StudentRepresentative_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "Representative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Period" ADD CONSTRAINT "Period_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_highSchoolLevelId_fkey" FOREIGN KEY ("highSchoolLevelId") REFERENCES "HighSchoolLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_paymentReferenceId_fkey" FOREIGN KEY ("paymentReferenceId") REFERENCES "StudentFee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelSubject" ADD CONSTRAINT "LevelSubject_highSchoolLevelId_fkey" FOREIGN KEY ("highSchoolLevelId") REFERENCES "HighSchoolLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelSubject" ADD CONSTRAINT "LevelSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingGroup" ADD CONSTRAINT "TeachingGroup_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingGroup" ADD CONSTRAINT "TeachingGroup_levelSubjectId_fkey" FOREIGN KEY ("levelSubjectId") REFERENCES "LevelSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingGroup" ADD CONSTRAINT "TeachingGroup_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingGroup" ADD CONSTRAINT "TeachingGroup_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTeachingGroup" ADD CONSTRAINT "StudentTeachingGroup_studentEnrollmentId_fkey" FOREIGN KEY ("studentEnrollmentId") REFERENCES "StudentEnrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTeachingGroup" ADD CONSTRAINT "StudentTeachingGroup_teachingGroupId_fkey" FOREIGN KEY ("teachingGroupId") REFERENCES "TeachingGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_teachingGroupId_fkey" FOREIGN KEY ("teachingGroupId") REFERENCES "TeachingGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluationTypeId_fkey" FOREIGN KEY ("evaluationTypeId") REFERENCES "EvaluationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeRecord" ADD CONSTRAINT "GradeRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeRecord" ADD CONSTRAINT "GradeRecord_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeRecord" ADD CONSTRAINT "GradeRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolStudentHistory" ADD CONSTRAINT "SchoolStudentHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolStudentHistory" ADD CONSTRAINT "SchoolStudentHistory_highSchoolLevelId_fkey" FOREIGN KEY ("highSchoolLevelId") REFERENCES "HighSchoolLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFailedSubject" ADD CONSTRAINT "StudentFailedSubject_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFailedSubject" ADD CONSTRAINT "StudentFailedSubject_levelSubjectId_fkey" FOREIGN KEY ("levelSubjectId") REFERENCES "LevelSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "State" ADD CONSTRAINT "State_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Municipality" ADD CONSTRAINT "Municipality_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parish" ADD CONSTRAINT "Parish_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_paymentTypeId_fkey" FOREIGN KEY ("paymentTypeId") REFERENCES "PaymentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFee" ADD CONSTRAINT "StudentFee_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFee" ADD CONSTRAINT "StudentFee_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "Fee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFee" ADD CONSTRAINT "StudentFee_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchange"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeWorkHour" ADD CONSTRAINT "EmployeeWorkHour_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeWorkHour" ADD CONSTRAINT "EmployeeWorkHour_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeWorkHour" ADD CONSTRAINT "EmployeeWorkHour_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRecord" ADD CONSTRAINT "PayrollRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRecord" ADD CONSTRAINT "PayrollRecord_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollAdjustment" ADD CONSTRAINT "PayrollAdjustment_payrollRecordId_fkey" FOREIGN KEY ("payrollRecordId") REFERENCES "PayrollRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

