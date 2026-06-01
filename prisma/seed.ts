import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, $Enums } from '../generated/prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
});

async function main() {
  const clearOnly = process.argv.slice(2).includes('--clear-only');

  if (clearOnly) {
    console.log('🧹 Modo solo limpieza activado...');
  } else {
    console.log('🌱 Iniciando seed...');
  }

  // ── Limpieza total con reset de secuencias ──
  console.log('Limpiando datos existentes...');
  const tables = [
    'PayrollAdjustment', 'PayrollRecord', 'EmployeeWorkHour', 'PayrollPeriod',
    'PaymentReference', 'Payment', 'Exchange', 'PaymentMethod', 'Fee',
    'ReportCard', 'GradeRecord', 'Evaluation', 'TeacherSubjectSection', 'Subject',
    'StudentEnrollment', 'StudentSection', 'Section', 'Period', 'SchoolYear',
    'HighSchoolLevel', 'StudentRepresentative', 'Employee', 'Representative',
    'Student', 'User', 'Person', 'Role',
  ];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
  }
  console.log('Limpieza completada.');

  if (clearOnly) {
    console.log('✅ Base de datos limpiada. No se insertaron datos.');
    return;
  }

  // ── 1. ROLES ──
  const rolesData = [
    { id: 1, role: 'Admin' },
    { id: 2, role: 'Director' },
    { id: 3, role: 'Subdirector' },
    { id: 4, role: 'Contador' },
    { id: 5, role: 'Control de Estudios' },
    { id: 6, role: 'Docente' },
    { id: 7, role: 'Representante' },
  ];
  await prisma.role.createMany({ data: rolesData });
  console.log('Roles creados.');

  // ── 2. PERSONAS ──
  const password = await bcrypt.hash('123456', 10);
  const adminPassword = await bcrypt.hash('admin', 10);

  const personsData = [
    {
      id: 1,
      firstNames: 'Luisangel',
      lastNames: 'Ugaz',
      identificationNumber: 'V-12345678',
      birthDate: new Date('1990-01-01'),
      gender: 'Masculino',
    },
    {
      id: 2,
      firstNames: 'Daniela',
      lastNames: 'Quintero',
      identificationNumber: 'V-87654321',
      birthDate: new Date('1985-05-15'),
      gender: 'Femenino',
    },
    {
      id: 3,
      firstNames: 'Yujenis',
      lastNames: 'Gonzalez',
      identificationNumber: 'V-11223344',
      birthDate: new Date('1982-03-20'),
      gender: 'Masculino',
    },
    {
      id: 4,
      firstNames: 'Yorhjan',
      lastNames: 'Fuentes',
      identificationNumber: 'V-99887766',
      birthDate: new Date('1988-07-10'),
      gender: 'Masculino',
    },
    {
      id: 5,
      firstNames: 'Yasmeli',
      lastNames: 'Villalobos',
      identificationNumber: 'V-55443322',
      birthDate: new Date('1992-11-25'),
      gender: 'Femenino',
    },
    {
      id: 6,
      firstNames: 'Ana',
      lastNames: 'García Castillo',
      identificationNumber: 'V-66778899',
      birthDate: new Date('1991-02-14'),
      gender: 'Femenino',
    },
    {
      id: 7,
      firstNames: 'Pedro',
      lastNames: 'Martínez Rivas',
      identificationNumber: 'V-44332211',
      birthDate: new Date('1987-09-30'),
      gender: 'Masculino',
    },
    {
      id: 8,
      firstNames: 'Carmen',
      lastNames: 'Jiménez Díaz',
      identificationNumber: 'V-13579246',
      birthDate: new Date('1980-04-18'),
      gender: 'Femenino',
    },
    {
      id: 9,
      firstNames: 'José',
      lastNames: 'Torrealba Campos',
      identificationNumber: 'V-24681357',
      birthDate: new Date('1978-08-22'),
      gender: 'Masculino',
    },
    {
      id: 10,
      firstNames: 'Luis Miguel',
      lastNames: 'Paredes Soto',
      identificationNumber: 'V-31415926',
      birthDate: new Date('2012-03-10'),
      gender: 'Masculino',
    },
    {
      id: 11,
      firstNames: 'Valentina',
      lastNames: 'Paredes Jiménez',
      identificationNumber: 'V-27182818',
      birthDate: new Date('2013-07-22'),
      gender: 'Femenino',
    },
    {
      id: 12,
      firstNames: 'Samuel',
      lastNames: 'Torrealba Jiménez',
      identificationNumber: 'V-16180339',
      birthDate: new Date('2011-11-05'),
      gender: 'Masculino',
    },
    {
      id: 13,
      firstNames: 'Isabella',
      lastNames: 'Torrealba Jiménez',
      identificationNumber: 'V-14142135',
      birthDate: new Date('2014-01-15'),
      gender: 'Femenino',
    },
    {
      id: 14,
      firstNames: 'Diego Alejandro',
      lastNames: 'García Rodríguez',
      identificationNumber: 'V-17320508',
      birthDate: new Date('2012-09-12'),
      gender: 'Masculino',
    },
    {
      id: 15,
      firstNames: 'Camila',
      lastNames: 'Martínez Rodríguez',
      identificationNumber: 'V-22360679',
      birthDate: new Date('2013-05-28'),
      gender: 'Femenino',
    },
    // ——— NUEVOS ESTUDIANTES ———
    {
      id: 16,
      firstNames: 'Mateo',
      lastNames: 'Hernández Rivas',
      identificationNumber: 'V-30102030',
      birthDate: new Date('2013-02-14'),
      gender: 'Masculino',
    },
    {
      id: 17,
      firstNames: 'Gabriela',
      lastNames: 'Pérez Castillo',
      identificationNumber: 'V-31213141',
      birthDate: new Date('2014-06-20'),
      gender: 'Femenino',
    },
    {
      id: 18,
      firstNames: 'Santiago',
      lastNames: 'Castillo López',
      identificationNumber: 'V-32223242',
      birthDate: new Date('2012-10-05'),
      gender: 'Masculino',
    },
    {
      id: 19,
      firstNames: 'Sofía',
      lastNames: 'Medina Torres',
      identificationNumber: 'V-33233343',
      birthDate: new Date('2013-12-18'),
      gender: 'Femenino',
    },
    {
      id: 20,
      firstNames: 'Andrés',
      lastNames: 'Rivas Pérez',
      identificationNumber: 'V-34243444',
      birthDate: new Date('2014-04-25'),
      gender: 'Masculino',
    },
    {
      id: 21,
      firstNames: 'Laura',
      lastNames: 'Contreras Silva',
      identificationNumber: 'V-35253545',
      birthDate: new Date('2012-08-30'),
      gender: 'Femenino',
    },
    // ——— NUEVOS REPRESENTANTES ———
    {
      id: 22,
      firstNames: 'Patricia',
      lastNames: 'Hernández de Rivas',
      identificationNumber: 'V-19283746',
      birthDate: new Date('1981-03-12'),
      gender: 'Femenino',
    },
    {
      id: 23,
      firstNames: 'Ricardo',
      lastNames: 'Pérez Castillo',
      identificationNumber: 'V-28374651',
      birthDate: new Date('1979-11-08'),
      gender: 'Masculino',
    },
    {
      id: 24,
      firstNames: 'Elena',
      lastNames: 'Medina de Torres',
      identificationNumber: 'V-37482910',
      birthDate: new Date('1983-07-25'),
      gender: 'Femenino',
    },
    {
      id: 25,
      firstNames: 'Fernando',
      lastNames: 'Contreras Silva',
      identificationNumber: 'V-46573829',
      birthDate: new Date('1980-05-16'),
      gender: 'Masculino',
    },
  ];
  await prisma.person.createMany({ data: personsData });
  console.log('Personas creadas.');

  // ── 3. USUARIOS ──
  const usersData = [
    { id: 1, personId: 1, roleId: 1, email: 'admin@admin.com', password: adminPassword, phone: '0412-1111111' },
    { id: 2, personId: 2, roleId: 2, email: 'directora@colegio.com', password, phone: '0412-2222222' },
    { id: 3, personId: 3, roleId: 3, email: 'subdirector@colegio.com', password, phone: '0412-3333333' },
    { id: 4, personId: 4, roleId: 4, email: 'administrador@colegio.com', password, phone: '0412-4444444' },
    { id: 5, personId: 5, roleId: 5, email: 'control@colegio.com', password, phone: '0412-5555555' },
    { id: 6, personId: 6, roleId: 6, email: 'ana.garcia@colegio.com', password, phone: '0412-6666666' },
    { id: 7, personId: 7, roleId: 6, email: 'pedro.martinez@colegio.com', password, phone: '0412-7777777' },
    { id: 8, personId: 8, roleId: 7, email: 'carmen.jimenez@correo.com', password, phone: '0412-8888888' },
    { id: 9, personId: 9, roleId: 7, email: 'jose.torrealba@correo.com', password, phone: '0412-9999999' },
    { id: 10, personId: 22, roleId: 7, email: 'patricia.hernandez@correo.com', password, phone: '0412-1010101' },
    { id: 11, personId: 23, roleId: 7, email: 'ricardo.perez@correo.com', password, phone: '0412-1111112' },
    { id: 12, personId: 24, roleId: 7, email: 'elena.medina@correo.com', password, phone: '0412-1212123' },
    { id: 13, personId: 25, roleId: 7, email: 'fernando.contreras@correo.com', password, phone: '0412-1313134' },
  ];
  await prisma.user.createMany({ data: usersData });
  console.log('Usuarios creados.');

  // ── 4. ESTUDIANTES ──
  const studentsData = [
    { personId: 10, birthCountry: 'Venezuela', state: 'Distrito Capital', municipality: 'Libertador', parish: 'Catedral', currentParish: 'Catedral', previousSchool: 'U.E. Simón Bolívar', address: 'Av. Principal, Los Chaguaramos, Caracas', status: true, admissionDate: new Date('2023-09-01') },
    { personId: 11, birthCountry: 'Venezuela', state: 'Distrito Capital', municipality: 'Libertador', parish: 'Catedral', currentParish: 'Catedral', previousSchool: 'U.E. Simón Bolívar', address: 'Av. Principal, Los Chaguaramos, Caracas', status: true, admissionDate: new Date('2023-09-01') },
    { personId: 12, birthCountry: 'Venezuela', state: 'Miranda', municipality: 'Baruta', parish: 'Baruta', currentParish: 'Baruta', previousSchool: 'U.E. Los Samanes', address: 'Calle 5, Urbanización Santa Cruz, Baruta', status: true, admissionDate: new Date('2023-09-01') },
    { personId: 13, birthCountry: 'Venezuela', state: 'Miranda', municipality: 'Baruta', parish: 'Baruta', currentParish: 'Baruta', previousSchool: 'U.E. Los Samanes', address: 'Calle 5, Urbanización Santa Cruz, Baruta', status: true, admissionDate: new Date('2023-09-01') },
    { personId: 14, birthCountry: 'Venezuela', state: 'Distrito Capital', municipality: 'Libertador', parish: 'El Recreo', currentParish: 'El Recreo', previousSchool: 'U.E. Don Bosco', address: 'Av. Andrés Bello, Edif. San José, Caracas', status: true, admissionDate: new Date('2024-09-01') },
    { personId: 15, birthCountry: 'Venezuela', state: 'Distrito Capital', municipality: 'Libertador', parish: 'El Recreo', currentParish: 'El Recreo', previousSchool: 'U.E. Don Bosco', address: 'Av. Andrés Bello, Edif. San José, Caracas', status: true, admissionDate: new Date('2024-09-01') },
    { personId: 16, birthCountry: 'Venezuela', state: 'Miranda', municipality: 'Sucre', parish: 'Petare', currentParish: 'Petare', previousSchool: 'U.E. José María Vargas', address: 'Calle 3, Petare, Caracas', status: true, admissionDate: new Date('2024-09-01') },
    { personId: 17, birthCountry: 'Venezuela', state: 'Distrito Capital', municipality: 'Libertador', parish: 'San Pedro', currentParish: 'San Pedro', previousSchool: 'U.E. Santo Domingo', address: 'Av. Los Ilustres, Res. Luz, Caracas', status: true, admissionDate: new Date('2024-09-01') },
    { personId: 18, birthCountry: 'Venezuela', state: 'Miranda', municipality: 'Chacao', parish: 'Chacao', currentParish: 'Chacao', previousSchool: 'U.E. Santo Domingo', address: 'Av. Principal, Edif. Chacao, Caracas', status: true, admissionDate: new Date('2025-09-01') },
    { personId: 19, birthCountry: 'Venezuela', state: 'Miranda', municipality: 'Baruta', parish: 'El Cafetal', currentParish: 'El Cafetal', previousSchool: 'U.E. Los Pinos', address: 'Calle 8, El Cafetal, Caracas', status: true, admissionDate: new Date('2025-09-01') },
    { personId: 20, birthCountry: 'Venezuela', state: 'Distrito Capital', municipality: 'Libertador', parish: 'San Agustín', currentParish: 'San Agustín', previousSchool: 'U.E. Los Pinos', address: 'Av. San Martín, Qta. Elena, Caracas', status: true, admissionDate: new Date('2025-09-01') },
    { personId: 21, birthCountry: 'Venezuela', state: 'Miranda', municipality: 'Sucre', parish: 'Los Dos Caminos', currentParish: 'Los Dos Caminos', previousSchool: 'U.E. San Francisco', address: 'Calle 9, Los Dos Caminos, Caracas', status: true, admissionDate: new Date('2025-09-01') },
  ];
  await prisma.student.createMany({ data: studentsData });
  console.log('Estudiantes creados.');

  // ── 5. REPRESENTANTES ──
  const representativesData = [
    { userId: 8, relationship: 'Madre', occupation: 'Abogada' },
    { userId: 9, relationship: 'Padre', occupation: 'Ingeniero' },
    { userId: 10, relationship: 'Madre', occupation: 'Docente' },
    { userId: 11, relationship: 'Padre', occupation: 'Médico' },
    { userId: 12, relationship: 'Madre', occupation: 'Contadora Pública' },
    { userId: 13, relationship: 'Padre', occupation: 'Arquitecto' },
  ];
  await prisma.representative.createMany({ data: representativesData });
  console.log('Representantes creados.');

  // ── 6. EMPLEADOS ──
  const employeesData = [
    { userId: 2, baseHourRate: 0, hireDate: new Date('2020-01-15') },
    { userId: 3, baseHourRate: 0, hireDate: new Date('2021-03-01') },
    { userId: 4, baseHourRate: 0, hireDate: new Date('2022-06-01') },
    { userId: 5, baseHourRate: 0, hireDate: new Date('2023-09-01') },
    { userId: 6, baseHourRate: 12.5, hireDate: new Date('2020-09-01') },
    { userId: 7, baseHourRate: 12.5, hireDate: new Date('2021-09-01') },
  ];
  await prisma.employee.createMany({ data: employeesData });
  console.log('Empleados creados.');

  // ── 7. STUDENT REPRESENTATIVE ──
  // Representante 1 (Carmen) -> Luis Miguel y Valentina
  // Representante 2 (José) -> Samuel, Isabella
  // Ambos representan a Diego y Camila (relación múltiple)
  const studentRepsData = [
    { studentId: 1, representativeId: 1 },
    { studentId: 2, representativeId: 1 },
    { studentId: 3, representativeId: 2 },
    { studentId: 4, representativeId: 2 },
    { studentId: 5, representativeId: 1 },
    { studentId: 5, representativeId: 2 },
    { studentId: 6, representativeId: 1 },
    { studentId: 6, representativeId: 2 },
    // Nuevos: representantes 3-6, estudiantes 7-12
    { studentId: 7, representativeId: 3 },
    { studentId: 8, representativeId: 4 },
    { studentId: 9, representativeId: 4 },
    { studentId: 10, representativeId: 5 },
    { studentId: 11, representativeId: 5 },
    { studentId: 12, representativeId: 6 },
  ];
  await prisma.studentRepresentative.createMany({ data: studentRepsData });
  console.log('Relaciones estudiante-representante creadas.');

  // ── 8. HIGH SCHOOL LEVELS ──
  const levelsData = [
    { id: 1, level: '1er Año' },
    { id: 2, level: '2do Año' },
    { id: 3, level: '3er Año' },
    { id: 4, level: '4to Año' },
    { id: 5, level: '5to Año' },
  ];
  await prisma.highSchoolLevel.createMany({ data: levelsData });
  console.log('Niveles creados.');

  // ── 9. SCHOOL YEARS ──
  const schoolYearsData = [
    { id: 1, name: '2024-2025', startDate: new Date('2024-09-15'), endDate: new Date('2025-07-15'), isActive: true },
    { id: 2, name: '2025-2026', startDate: new Date('2025-09-15'), endDate: new Date('2026-07-15'), isActive: false },
  ];
  await prisma.schoolYear.createMany({ data: schoolYearsData });
  console.log('Años escolares creados.');

  // ── 10. PERIODS ──
  const periodsData = [
    { id: 1, schoolYearId: 1, period: '1er Lapso', startDate: new Date('2024-09-15'), endDate: new Date('2024-12-20') },
    { id: 2, schoolYearId: 1, period: '2do Lapso', startDate: new Date('2025-01-13'), endDate: new Date('2025-04-11') },
    { id: 3, schoolYearId: 1, period: '3er Lapso', startDate: new Date('2025-04-14'), endDate: new Date('2025-07-15') },
    { id: 4, schoolYearId: 2, period: '1er Lapso', startDate: new Date('2025-09-15'), endDate: new Date('2025-12-19') },
    { id: 5, schoolYearId: 2, period: '2do Lapso', startDate: new Date('2026-01-12'), endDate: new Date('2026-04-10') },
    { id: 6, schoolYearId: 2, period: '3er Lapso', startDate: new Date('2026-04-13'), endDate: new Date('2026-07-15') },
  ];
  await prisma.period.createMany({ data: periodsData });
  console.log('Períodos creados.');

  // ── 11. SECTIONS ──
  const sectionsData = [
    // Año escolar 2024-2025
    { id: 1, schoolYearId: 1, highSchoolLevelId: 1, section: 'A' },
    { id: 2, schoolYearId: 1, highSchoolLevelId: 1, section: 'B' },
    { id: 3, schoolYearId: 1, highSchoolLevelId: 2, section: 'A' },
    { id: 4, schoolYearId: 1, highSchoolLevelId: 2, section: 'B' },
    { id: 5, schoolYearId: 1, highSchoolLevelId: 3, section: 'A' },
    { id: 6, schoolYearId: 1, highSchoolLevelId: 3, section: 'B' },
    { id: 7, schoolYearId: 1, highSchoolLevelId: 4, section: 'A' },
    { id: 8, schoolYearId: 1, highSchoolLevelId: 4, section: 'B' },
    { id: 9, schoolYearId: 1, highSchoolLevelId: 5, section: 'A' },
    { id: 10, schoolYearId: 1, highSchoolLevelId: 5, section: 'B' },
    // Año escolar 2025-2026
    { id: 11, schoolYearId: 2, highSchoolLevelId: 1, section: 'A' },
    { id: 12, schoolYearId: 2, highSchoolLevelId: 1, section: 'B' },
    { id: 13, schoolYearId: 2, highSchoolLevelId: 2, section: 'A' },
    { id: 14, schoolYearId: 2, highSchoolLevelId: 2, section: 'B' },
    { id: 15, schoolYearId: 2, highSchoolLevelId: 3, section: 'A' },
    { id: 16, schoolYearId: 2, highSchoolLevelId: 3, section: 'B' },
    { id: 17, schoolYearId: 2, highSchoolLevelId: 4, section: 'A' },
    { id: 18, schoolYearId: 2, highSchoolLevelId: 4, section: 'B' },
    { id: 19, schoolYearId: 2, highSchoolLevelId: 5, section: 'A' },
    { id: 20, schoolYearId: 2, highSchoolLevelId: 5, section: 'B' },
  ];
  await prisma.section.createMany({ data: sectionsData });
  console.log('Secciones creadas.');

  // ── 12. STUDENT SECTIONS ──
  // Se asigna cada estudiante a una sección en el año 2024-2025
  const studentSectionsData = [
    { studentId: 1, sectionId: 1, enrollmentDate: new Date('2024-09-15'), status: true },
    { studentId: 2, sectionId: 2, enrollmentDate: new Date('2024-09-15'), status: true },
    { studentId: 3, sectionId: 5, enrollmentDate: new Date('2024-09-15'), status: true },
    { studentId: 4, sectionId: 6, enrollmentDate: new Date('2024-09-15'), status: true },
    { studentId: 5, sectionId: 7, enrollmentDate: new Date('2024-09-15'), status: true },
    { studentId: 6, sectionId: 9, enrollmentDate: new Date('2024-09-15'), status: true },
    { studentId: 7, sectionId: 11, enrollmentDate: new Date('2025-09-15'), status: true },
    { studentId: 8, sectionId: 12, enrollmentDate: new Date('2025-09-15'), status: true },
    { studentId: 9, sectionId: 13, enrollmentDate: new Date('2025-09-15'), status: true },
    { studentId: 10, sectionId: 14, enrollmentDate: new Date('2025-09-15'), status: true },
    { studentId: 11, sectionId: 11, enrollmentDate: new Date('2025-09-15'), status: true },
    { studentId: 12, sectionId: 16, enrollmentDate: new Date('2025-09-15'), status: true },
  ];
  await prisma.studentSection.createMany({ data: studentSectionsData });
  console.log('Inscripciones en secciones creadas.');

  // ── 13. STUDENT ENROLLMENTS ──
  const enrollmentsData = [
    { studentId: 1, schoolYearId: 1, sectionId: 1, enrollmentDate: new Date('2024-09-15'), status: true },
    { studentId: 2, schoolYearId: 1, sectionId: 2, enrollmentDate: new Date('2024-09-15'), status: true },
    { studentId: 3, schoolYearId: 1, sectionId: 5, enrollmentDate: new Date('2024-09-15'), status: true },
    { studentId: 4, schoolYearId: 1, sectionId: 6, enrollmentDate: new Date('2024-09-15'), status: true },
    { studentId: 5, schoolYearId: 1, sectionId: 7, enrollmentDate: new Date('2024-09-15'), status: true },
    { studentId: 6, schoolYearId: 1, sectionId: 9, enrollmentDate: new Date('2024-09-15'), status: true },
    { studentId: 7, schoolYearId: 2, sectionId: 11, enrollmentDate: new Date('2025-09-15'), status: true },
    { studentId: 8, schoolYearId: 2, sectionId: 12, enrollmentDate: new Date('2025-09-15'), status: true },
    { studentId: 9, schoolYearId: 2, sectionId: 13, enrollmentDate: new Date('2025-09-15'), status: true },
    { studentId: 10, schoolYearId: 2, sectionId: 14, enrollmentDate: new Date('2025-09-15'), status: true },
    { studentId: 11, schoolYearId: 2, sectionId: 11, enrollmentDate: new Date('2025-09-15'), status: true },
    { studentId: 12, schoolYearId: 2, sectionId: 16, enrollmentDate: new Date('2025-09-15'), status: true },
  ];
  await prisma.studentEnrollment.createMany({ data: enrollmentsData });
  console.log('Matrículas oficiales creadas.');

  // ── 14. FEES ──
  const feesData = [
    { id: 1, name: 'Inscripción', schoolYearId: 1, value: 50, createdAt: new Date('2024-09-01') },
    { id: 2, name: 'Mensualidad', schoolYearId: 1, value: 350, createdAt: new Date('2024-09-01') },
    { id: 3, name: 'Inscripción', schoolYearId: 2, value: 55, createdAt: new Date('2025-09-01') },
    { id: 4, name: 'Mensualidad', schoolYearId: 2, value: 380, createdAt: new Date('2025-09-01') },
  ];
  await prisma.fee.createMany({ data: feesData });
  console.log('Aranceles creados.');

  // ── 15. PAYMENT METHODS ──
  const paymentMethodsData = [
    { id: 1, type: 'Efectivo (Bs.)', active: true },
    { id: 2, type: 'Efectivo ($)', active: true },
    { id: 3, type: 'Transferencia', bank: 'Banco Venezuela', accountNumber: '0102-123456-7', identification: 'J-12345678-9', active: true },
    { id: 4, type: 'Pago Móvil', phone: '0412-1234567', identification: 'V-12345678', owner: 'Colegio Francisco de Paula', active: true },
    { id: 5, type: 'Transferencia', bank: 'Bank of America', accountNumber: '123456789', active: true },
    { id: 6, type: 'Zelle', email: 'payments@colegio.com', owner: 'Colegio Francisco de Paula', active: true },
  ];
  await prisma.paymentMethod.createMany({ data: paymentMethodsData });
  console.log('Métodos de pago creados.');

  // ── 16. EXCHANGE RATES ──
  const exchangesData = [
    { id: 1, rate: 36.5, date: new Date('2024-09-15') },
    { id: 2, rate: 42.8, date: new Date('2025-01-15') },
    { id: 3, rate: 55.2, date: new Date('2025-05-15') },
  ];
  await prisma.exchange.createMany({ data: exchangesData });
  console.log('Tasas de cambio creadas.');

  // ── 17. PAYMENTS ──
  const paymentsData = [
    {
      id: 1,
      paymentMethodId: 1,
      exchangeId: 1,
      totalAmount: 50.0,
      currency: $Enums.Currency.VES,
      paymentDate: new Date('2024-09-20'),
      reference: 'REC-001',
      payerName: 'Carmen Jiménez',
      payerIdentification: 'V-13579246',
      payerPhone: '0412-8888888',
      status: true,
    },
    {
      id: 2,
      paymentMethodId: 4,
      exchangeId: 1,
      totalAmount: 1825.0,
      currency: $Enums.Currency.VES,
      paymentDate: new Date('2024-09-20'),
      reference: 'PM-001',
      payerName: 'Carmen Jiménez',
      payerIdentification: 'V-13579246',
      payerPhone: '0412-8888888',
      status: true,
    },
    {
      id: 3,
      paymentMethodId: 2,
      exchangeId: 2,
      totalAmount: 100.0,
      currency: $Enums.Currency.USD,
      paymentDate: new Date('2025-02-10'),
      reference: 'REC-002',
      payerName: 'José Torrealba',
      payerIdentification: 'V-24681357',
      payerPhone: '0412-9999999',
      status: true,
    },
    {
      id: 4,
      paymentMethodId: 3,
      exchangeId: 2,
      totalAmount: 2140.0,
      currency: $Enums.Currency.VES,
      paymentDate: new Date('2025-02-10'),
      reference: 'TRF-001',
      payerName: 'José Torrealba',
      payerIdentification: 'V-24681357',
      payerPhone: '0412-9999999',
      status: true,
    },
    {
      id: 5,
      paymentMethodId: 5,
      totalAmount: 200.0,
      currency: $Enums.Currency.USD,
      paymentDate: new Date('2025-04-05'),
      reference: 'TRF-USD-001',
      payerName: 'Carmen Jiménez',
      payerIdentification: 'V-13579246',
      payerPhone: '0412-8888888',
      status: false,
    },
    {
      id: 6,
      paymentMethodId: 6,
      totalAmount: 150.0,
      currency: $Enums.Currency.USD,
      paymentDate: new Date('2025-05-20'),
      reference: 'ZLL-001',
      payerName: 'José Torrealba',
      payerIdentification: 'V-24681357',
      payerPhone: '0412-9999999',
      status: true,
    },
    // ——— PAGOS NUEVOS ESTUDIANTES ———
    {
      id: 7,
      paymentMethodId: 1,
      exchangeId: 3,
      totalAmount: 45.0,
      currency: $Enums.Currency.VES,
      paymentDate: new Date('2025-10-01'),
      reference: 'REC-003',
      payerName: 'Patricia Hernández de Rivas',
      payerIdentification: 'V-19283746',
      payerPhone: '0412-1010101',
      status: true,
    },
    {
      id: 8,
      paymentMethodId: 4,
      exchangeId: 3,
      totalAmount: 3312.0,
      currency: $Enums.Currency.VES,
      paymentDate: new Date('2025-10-01'),
      reference: 'PM-002',
      payerName: 'Ricardo Pérez Castillo',
      payerIdentification: 'V-28374651',
      payerPhone: '0412-1111112',
      status: true,
    },
    {
      id: 9,
      paymentMethodId: 3,
      exchangeId: 3,
      totalAmount: 2208.0,
      currency: $Enums.Currency.VES,
      paymentDate: new Date('2025-10-05'),
      reference: 'TRF-002',
      payerName: 'Elena Medina de Torres',
      payerIdentification: 'V-37482910',
      payerPhone: '0412-1212123',
      status: true,
    },
    {
      id: 10,
      paymentMethodId: 6,
      totalAmount: 100.0,
      currency: $Enums.Currency.USD,
      paymentDate: new Date('2025-10-10'),
      reference: 'ZLL-002',
      payerName: 'Fernando Contreras Silva',
      payerIdentification: 'V-46573829',
      payerPhone: '0412-1313134',
      status: true,
    },
  ];
  await prisma.payment.createMany({ data: paymentsData });
  console.log('Pagos creados.');

  // ── 18. PAYMENT REFERENCES ──
  const paymentReferencesData = [
    { id: 1, feeId: 1, paymentId: 1 },
    { id: 2, feeId: 1, paymentId: 2 },
    { id: 3, feeId: 2, paymentId: 2 },
    { id: 4, feeId: 2, paymentId: 2 },
    { id: 5, feeId: 1, paymentId: 3 },
    { id: 6, feeId: 2, paymentId: 4 },
    { id: 7, feeId: 2, paymentId: 4 },
    { id: 8, feeId: 2, paymentId: 5 },
    { id: 9, feeId: 2, paymentId: 5 },
    { id: 10, feeId: 2, paymentId: 6 },
    { id: 11, feeId: 2, paymentId: 6 },
    { id: 12, feeId: 1, paymentId: 7 },
    { id: 13, feeId: 1, paymentId: 8 },
    { id: 14, feeId: 2, paymentId: 8 },
    { id: 15, feeId: 1, paymentId: 9 },
    { id: 16, feeId: 2, paymentId: 9 },
    { id: 17, feeId: 2, paymentId: 10 },
    { id: 18, feeId: 1, paymentId: 10 },
  ];
  await prisma.paymentReference.createMany({ data: paymentReferencesData });
  console.log('Referencias de pago creadas.');

  // ── Sincronizar secuencias auto-increment ──
  const sequences = [
    'Role_id_seq', 'Person_id_seq', 'User_id_seq',
    'Student_id_seq', 'Representative_id_seq', 'Employee_id_seq',
    'StudentRepresentative_id_seq', 'HighSchoolLevel_id_seq',
    'SchoolYear_id_seq', 'Period_id_seq', 'Section_id_seq',
    'StudentSection_id_seq', 'StudentEnrollment_id_seq',
    'Fee_id_seq', 'PaymentMethod_id_seq', 'Exchange_id_seq',
    'Payment_id_seq', 'PaymentReference_id_seq',
  ];
  for (const seq of sequences) {
    const table = seq.replace('_id_seq', '');
    await prisma.$executeRawUnsafe(
      `SELECT setval('"${seq}"', COALESCE((SELECT MAX(id) FROM "${table}"), 1))`
    );
  }
  console.log('Secuencias sincronizadas.');

  console.log('✅ Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
