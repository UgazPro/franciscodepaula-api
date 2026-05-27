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
    'StudentCharge', 'Payment', 'Exchange', 'PaymentMethod', 'ChargeType',
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
    { id: 4, role: 'Administrador' },
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
      lastNames: 'Ugaz Vásquez',
      identificationNumber: 'V-12345678',
      birthDate: new Date('1990-01-01'),
      gender: 'Masculino',
    },
    {
      id: 2,
      firstNames: 'María',
      lastNames: 'Rodríguez de García',
      identificationNumber: 'V-87654321',
      birthDate: new Date('1985-05-15'),
      gender: 'Femenino',
    },
    {
      id: 3,
      firstNames: 'Carlos',
      lastNames: 'Mendoza López',
      identificationNumber: 'V-11223344',
      birthDate: new Date('1982-03-20'),
      gender: 'Masculino',
    },
    {
      id: 4,
      firstNames: 'Luis',
      lastNames: 'Fernández Pérez',
      identificationNumber: 'V-99887766',
      birthDate: new Date('1988-07-10'),
      gender: 'Masculino',
    },
    {
      id: 5,
      firstNames: 'Sofía',
      lastNames: 'Contreras Medina',
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
  ];
  await prisma.user.createMany({ data: usersData });
  console.log('Usuarios creados.');

  // ── 4. ESTUDIANTES ──
  const studentsData = [
    { personId: 10, birthCountry: 'Venezuela', state: 'Distrito Capital', municipality: 'Libertador', parish: 'Catedral', previousSchool: 'U.E. Simón Bolívar', address: 'Av. Principal, Los Chaguaramos, Caracas', status: true, admissionDate: new Date('2023-09-01') },
    { personId: 11, birthCountry: 'Venezuela', state: 'Distrito Capital', municipality: 'Libertador', parish: 'Catedral', previousSchool: 'U.E. Simón Bolívar', address: 'Av. Principal, Los Chaguaramos, Caracas', status: true, admissionDate: new Date('2023-09-01') },
    { personId: 12, birthCountry: 'Venezuela', state: 'Miranda', municipality: 'Baruta', parish: 'Baruta', previousSchool: 'U.E. Los Samanes', address: 'Calle 5, Urbanización Santa Cruz, Baruta', status: true, admissionDate: new Date('2023-09-01') },
    { personId: 13, birthCountry: 'Venezuela', state: 'Miranda', municipality: 'Baruta', parish: 'Baruta', previousSchool: 'U.E. Los Samanes', address: 'Calle 5, Urbanización Santa Cruz, Baruta', status: true, admissionDate: new Date('2023-09-01') },
    { personId: 14, birthCountry: 'Venezuela', state: 'Distrito Capital', municipality: 'Libertador', parish: 'El Recreo', previousSchool: 'U.E. Don Bosco', address: 'Av. Andrés Bello, Edif. San José, Caracas', status: true, admissionDate: new Date('2024-09-01') },
    { personId: 15, birthCountry: 'Venezuela', state: 'Distrito Capital', municipality: 'Libertador', parish: 'El Recreo', previousSchool: 'U.E. Don Bosco', address: 'Av. Andrés Bello, Edif. San José, Caracas', status: true, admissionDate: new Date('2024-09-01') },
  ];
  await prisma.student.createMany({ data: studentsData });
  console.log('Estudiantes creados.');

  // ── 5. REPRESENTANTES ──
  const representativesData = [
    { userId: 8, relationship: 'Madre', occupation: 'Abogada' },
    { userId: 9, relationship: 'Padre', occupation: 'Ingeniero' },
  ];
  await prisma.representative.createMany({ data: representativesData });
  console.log('Representantes creados.');

  // ── 6. EMPLEADOS ──
  const employeesData = [
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
  ];
  await prisma.studentEnrollment.createMany({ data: enrollmentsData });
  console.log('Matrículas oficiales creadas.');

  // ── 14. CHARGE TYPES ──
  const chargeTypesData = [
    { id: 1, name: 'Matrícula', description: 'Pago de matrícula anual' },
    { id: 2, name: 'Mensualidad', description: 'Pago de mensualidad escolar' },
    { id: 3, name: 'Inscripción', description: 'Pago de inscripción por año escolar' },
    { id: 4, name: 'Material Educativo', description: 'Pago de material educativo y textos' },
    { id: 5, name: 'Uniforme', description: 'Pago de uniforme escolar' },
    { id: 6, name: 'Actividad Extraescolar', description: 'Pago de actividades culturales y deportivas' },
  ];
  await prisma.chargeType.createMany({ data: chargeTypesData });
  console.log('Tipos de cargo creados.');

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
  ];
  await prisma.payment.createMany({ data: paymentsData });
  console.log('Pagos creados.');

  // ── 18. STUDENT CHARGES ──
  const chargesData = [
    // Carmen Jiménez — hijos: Luis Miguel (1) y Valentina (2)
    // Matrícula + mensualidad sept + uniforme para ambos
    { studentId: 1, paymentId: 1, chargeTypeId: 5, schoolYearId: 1, description: 'Uniforme escolar - Luis Miguel' },
    { studentId: 2, paymentId: 2, chargeTypeId: 1, schoolYearId: 1, description: 'Matrícula 2024-2025 - Valentina' },
    { studentId: 2, paymentId: 2, chargeTypeId: 2, schoolYearId: 1, description: 'Mensualidad septiembre - Valentina' },
    { studentId: 1, paymentId: 2, chargeTypeId: 2, schoolYearId: 1, description: 'Mensualidad septiembre - Luis Miguel' },

    // José Torrealba — hijos: Samuel (3) e Isabella (4)
    // Matrícula + mensualidad feb para Samuel; mensualidad feb para Isabella
    { studentId: 3, paymentId: 3, chargeTypeId: 1, schoolYearId: 1, description: 'Matrícula 2024-2025 - Samuel' },
    { studentId: 3, paymentId: 4, chargeTypeId: 2, schoolYearId: 1, description: 'Mensualidad febrero - Samuel' },
    { studentId: 4, paymentId: 4, chargeTypeId: 2, schoolYearId: 1, description: 'Mensualidad febrero - Isabella' },

    // Pagos pendientes (payment.status = false)
    { studentId: 5, paymentId: 5, chargeTypeId: 2, schoolYearId: 1, description: 'Mensualidad abril - Diego (pendiente)' },
    { studentId: 6, paymentId: 5, chargeTypeId: 2, schoolYearId: 1, description: 'Mensualidad abril - Camila (pendiente)' },

    // Pago con Zelle - Material educativo para Samuel
    { studentId: 3, paymentId: 6, chargeTypeId: 4, schoolYearId: 1, description: 'Material educativo 2024-2025 - Samuel' },
    { studentId: 4, paymentId: 6, chargeTypeId: 4, schoolYearId: 1, description: 'Material educativo 2024-2025 - Isabella' },

    // Cargos sin pago asociado (deudas pendientes)
    { studentId: 5, chargeTypeId: 1, schoolYearId: 1, description: 'Matrícula 2024-2025 - Diego (adeudado)' },
    { studentId: 6, chargeTypeId: 1, schoolYearId: 1, description: 'Matrícula 2024-2025 - Camila (adeudado)' },
  ];
  await prisma.studentCharge.createMany({ data: chargesData });
  console.log('Cargos de estudiantes creados.');

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
