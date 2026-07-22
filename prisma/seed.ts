import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, $Enums } from '../generated/prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
});

// ── Helpers ──
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

const maleNames = [
  'Carlos', 'José', 'Luis', 'Jesús', 'Miguel', 'Jorge', 'Alberto', 'Rafael', 'Manuel', 'Antonio',
  'Alejandro', 'Diego', 'Santiago', 'Mateo', 'Sebastián', 'Daniel', 'Gabriel', 'Adrián', 'Pablo', 'Samuel',
  'Andrés', 'David', 'Ángel', 'Juan', 'Julián', 'Fernando', 'Ricardo', 'Eduardo', 'Francisco', 'Iván',
  'Víctor', 'Héctor', 'Raúl', 'Alfredo', 'Erick', 'Leonardo', 'Marco', 'Hugo', 'Martín', 'Javier',
  'Cristian', 'Kevin', 'Brandon', 'Pedro', 'Oscar', 'Gregorio', 'Simón', 'Fabián', 'Rubén', 'Ismael',
];

const femaleNames = [
  'María', 'Ana', 'Carmen', 'Sofía', 'Valentina', 'Isabella', 'Gabriela', 'Laura', 'Camila', 'Daniela',
  'Lucía', 'Paula', 'Andrea', 'Marta', 'Elena', 'Rosa', 'Patricia', 'Susana', 'Raquel', 'Liliana',
  'Verónica', 'Yulissa', 'Francys', 'Nathaly', 'Génesis', 'Luisana', 'Mariangel', 'Oriana', 'Bárbara', 'Alejandra',
  'Mariela', 'Lorena', 'Karina', 'Yolanda', 'Beatriz', 'Cristina', 'Diana', 'Mónica', 'Irene', 'Silvia',
  'Natalia', 'Claudia', 'Teresa', 'Ángela', 'Gloria', 'Margarita', 'Ruth', 'Eva', 'Julia', 'Leticia',
];

const lastNames = [
  'Pérez', 'García', 'Rodríguez', 'Martínez', 'Hernández', 'López', 'González', 'Rivas', 'Castillo', 'Contreras',
  'Torres', 'Medina', 'Silva', 'Jiménez', 'Díaz', 'Mendoza', 'Rojas', 'Acosta', 'Castro', 'Ortiz',
  'Molina', 'Álvarez', 'Peña', 'León', 'Navarro', 'Cruz', 'Reyes', 'Mejías', 'Quintero', 'Villalobos',
  'Machado', 'Rondón', 'Colina', 'Urdaneta', 'Briceño', 'Finol', 'Baez', 'Cárdenas', 'Arias', 'Morales',
  'Delgado', 'Tovar', 'Guedez', 'Parra', 'Suárez', 'Bravo', 'Figueroa', 'Salazar', 'Paredes', 'Ferrer',
];

const representativeRelations = ['Madre', 'Padre', 'Representante Legal', 'Tío', 'Tía', 'Abuelo', 'Abuela', 'Hermano', 'Hermana'];
const occupations = ['Abogado(a)', 'Ingeniero(a)', 'Médico(a)', 'Docente', 'Contador(a) Público(a)', 'Arquitecto(a)', 'Comerciante', 'Chofer', 'Enfermero(a)', 'Administrador(a)', 'Psicólogo(a)', 'Odontólogo(a)', 'Empresario(a)', 'Agricultor(a)', 'Ama de Casa'];
const municipalities_names = ['Maracaibo', 'San Francisco', 'Jesús Enrique Lossada', 'La Cañada de Urdaneta', 'Mara', 'Cabimas', 'Lagunillas', 'Santa Rita', 'Miranda', 'Baralt'];
const parish_names_map: Record<string, string[]> = {
  'Maracaibo': ['Bolívar', 'Cacique Mara', 'Carracciolo Parra Pérez', 'Cecilio Acosta', 'Cristo de Aranza', 'Coquivacoa', 'Chiquinquirá', 'Francisco Eugenio Bustamante', 'Idelfonso Vásquez', 'Juana de Ávila', 'Luis Hurtado Higuera', 'Manuel Dagnino', 'Olegario Villalobos', 'Raúl Leoni', 'Santa Lucía', 'San Isidro', 'Venancio Pulgar', 'Antonio Borjas Romero'],
  'San Francisco': ['San Francisco', 'El Bajo', 'Domitila Flores', 'Francisco Ochoa', 'Los Cortijos', 'Marcial Hernández', 'José Domingo Rus'],
  'Jesús Enrique Lossada': ['José Ramón Yépez', 'María de los Ángeles', 'La Concepción', 'San José'],
  'La Cañada de Urdaneta': ['Concepción', 'Andrés Bello', 'Chiquinquirá', 'El Carmelo', 'Potreritos'],
  'Mara': ['Bolívar', 'Guadalupe', 'La Sierrita', 'San Rafael', 'Ricaurte'],
  'Cabimas': ['Ambrosio', 'Carmen Herrera', 'Germán Ríos Linares', 'Jorge Hernández', 'La Rosa', 'Punta Gorda', 'San Benito', 'San Juan', 'Arístides Calvani', 'Nueva Cabimas'],
  'Lagunillas': ['Alonso de Ojeda', 'Campo Lara', 'Eleazar López Contreras', 'Francisco Javier Pulgar', 'Libertad', 'Venezuela'],
  'Santa Rita': ['Santa Rita', 'El Menito', 'José Cenobio Urribarrí'],
  'Miranda': ['Alta Guajira', 'San José', 'Ana María Campos', 'Faría', 'Monagas'],
  'Baralt': ['General Urdaneta', 'Libertador', 'Marcelino Briceño', 'Pueblo Nuevo', 'Manuel Guanipa Matos'],
};

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
    'SchoolStudentHistory', 'StudentFailedSubject', 'School',
    'PayrollAdjustment', 'PayrollRecord', 'EmployeeWorkHour', 'PayrollPeriod',
    'Payment', 'Exchange', 'PaymentType', 'PaymentMethod', 'Fee',
    'GradeRecord', 'Evaluation', 'EvaluationType', 'StudentTeachingGroup', 'TeachingGroup', 'LevelSubject', 'Subject',
    'StudentEnrollment', 'Section', 'Period', 'SchoolYear',
    'HighSchoolLevel', 'StudentRepresentative', 'Employee', 'Representative',
    'UserRole', 'Student', 'User', 'Person', 'Role',
    'Parish', 'Municipality', 'State', 'Country',
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
  await prisma.role.createMany({
    data: [
      { id: 1, role: 'Admin' },
      { id: 2, role: 'Director' },
      { id: 3, role: 'Subdirector' },
      { id: 4, role: 'Contador' },
      { id: 5, role: 'Control de Estudios' },
      { id: 6, role: 'Docente' },
      { id: 7, role: 'Representante' },
    ],
  });
  console.log('Roles creados.');

  // ── 2. LOCATION ──
  await prisma.country.createMany({
    data: [
      { name: 'Venezuela' }, { name: 'Colombia' }, { name: 'Ecuador' },
      { name: 'Perú' }, { name: 'Chile' }, { name: 'Argentina' },
      { name: 'Brasil' }, { name: 'México' }, { name: 'España' },
      { name: 'Estados Unidos' }, { name: 'Panamá' }, { name: 'República Dominicana' },
      { name: 'Cuba' }, { name: 'Italia' }, { name: 'Portugal' },
    ],
  });
  const venezuela = await prisma.country.findUnique({ where: { name: 'Venezuela' } });

  await prisma.state.createMany({
    data: [
      { countryId: venezuela!.id, name: 'Amazonas' },
      { countryId: venezuela!.id, name: 'Anzoátegui' },
      { countryId: venezuela!.id, name: 'Apure' },
      { countryId: venezuela!.id, name: 'Aragua' },
      { countryId: venezuela!.id, name: 'Barinas' },
      { countryId: venezuela!.id, name: 'Bolívar' },
      { countryId: venezuela!.id, name: 'Carabobo' },
      { countryId: venezuela!.id, name: 'Cojedes' },
      { countryId: venezuela!.id, name: 'Delta Amacuro' },
      { countryId: venezuela!.id, name: 'Distrito Capital' },
      { countryId: venezuela!.id, name: 'Falcón' },
      { countryId: venezuela!.id, name: 'Guárico' },
      { countryId: venezuela!.id, name: 'La Guaira' },
      { countryId: venezuela!.id, name: 'Lara' },
      { countryId: venezuela!.id, name: 'Mérida' },
      { countryId: venezuela!.id, name: 'Miranda' },
      { countryId: venezuela!.id, name: 'Monagas' },
      { countryId: venezuela!.id, name: 'Nueva Esparta' },
      { countryId: venezuela!.id, name: 'Portuguesa' },
      { countryId: venezuela!.id, name: 'Sucre' },
      { countryId: venezuela!.id, name: 'Táchira' },
      { countryId: venezuela!.id, name: 'Trujillo' },
      { countryId: venezuela!.id, name: 'Yaracuy' },
      { countryId: venezuela!.id, name: 'Zulia' },
    ],
  });

  const zulia = await prisma.state.findFirst({ where: { name: 'Zulia', countryId: venezuela!.id } });
  const municipios = [
    { stateId: zulia!.id, name: 'Almirante Padilla' },
    { stateId: zulia!.id, name: 'Baralt' },
    { stateId: zulia!.id, name: 'Cabimas' },
    { stateId: zulia!.id, name: 'Catatumbo' },
    { stateId: zulia!.id, name: 'Colón' },
    { stateId: zulia!.id, name: 'Francisco Javier Pulgar' },
    { stateId: zulia!.id, name: 'Jesús Enrique Lossada' },
    { stateId: zulia!.id, name: 'Jesús María Semprún' },
    { stateId: zulia!.id, name: 'La Cañada de Urdaneta' },
    { stateId: zulia!.id, name: 'Lagunillas' },
    { stateId: zulia!.id, name: 'Machiques de Perijá' },
    { stateId: zulia!.id, name: 'Mara' },
    { stateId: zulia!.id, name: 'Maracaibo' },
    { stateId: zulia!.id, name: 'Miranda' },
    { stateId: zulia!.id, name: 'Rosario de Perijá' },
    { stateId: zulia!.id, name: 'San Francisco' },
    { stateId: zulia!.id, name: 'Santa Rita' },
    { stateId: zulia!.id, name: 'Simón Bolívar' },
    { stateId: zulia!.id, name: 'Sucre' },
    { stateId: zulia!.id, name: 'Valmore Rodríguez' },
  ];
  await prisma.municipality.createMany({ data: municipios });
  const allMunicipalities = await prisma.municipality.findMany({ where: { stateId: zulia!.id } });
  const muniMap = Object.fromEntries(allMunicipalities.map((m) => [m.name, m.id]));

  await prisma.parish.createMany({
    data: [
      { municipalityId: muniMap['Almirante Padilla'], name: 'Isla de Toas' },
      { municipalityId: muniMap['Almirante Padilla'], name: 'Monagas' },
      { municipalityId: muniMap['Baralt'], name: 'General Urdaneta' },
      { municipalityId: muniMap['Baralt'], name: 'Libertador' },
      { municipalityId: muniMap['Baralt'], name: 'Marcelino Briceño' },
      { municipalityId: muniMap['Baralt'], name: 'Pueblo Nuevo' },
      { municipalityId: muniMap['Baralt'], name: 'Manuel Guanipa Matos' },
      { municipalityId: muniMap['Cabimas'], name: 'Ambrosio' },
      { municipalityId: muniMap['Cabimas'], name: 'Carmen Herrera' },
      { municipalityId: muniMap['Cabimas'], name: 'Germán Ríos Linares' },
      { municipalityId: muniMap['Cabimas'], name: 'Jorge Hernández' },
      { municipalityId: muniMap['Cabimas'], name: 'La Rosa' },
      { municipalityId: muniMap['Cabimas'], name: 'Punta Gorda' },
      { municipalityId: muniMap['Cabimas'], name: 'San Benito' },
      { municipalityId: muniMap['Cabimas'], name: 'San Juan' },
      { municipalityId: muniMap['Cabimas'], name: 'Arístides Calvani' },
      { municipalityId: muniMap['Cabimas'], name: 'Nueva Cabimas' },
      { municipalityId: muniMap['Catatumbo'], name: 'Encontrados' },
      { municipalityId: muniMap['Catatumbo'], name: 'Udón Pérez' },
      { municipalityId: muniMap['Colón'], name: 'San Carlos del Zulia' },
      { municipalityId: muniMap['Colón'], name: 'Moralito' },
      { municipalityId: muniMap['Colón'], name: 'Santa Bárbara' },
      { municipalityId: muniMap['Colón'], name: 'Urribarrí' },
      { municipalityId: muniMap['Francisco Javier Pulgar'], name: 'Carlos Quevedo' },
      { municipalityId: muniMap['Francisco Javier Pulgar'], name: 'Francisco Javier Pulgar' },
      { municipalityId: muniMap['Francisco Javier Pulgar'], name: 'Simón Rodríguez' },
      { municipalityId: muniMap['Jesús Enrique Lossada'], name: 'José Ramón Yépez' },
      { municipalityId: muniMap['Jesús Enrique Lossada'], name: 'María de los Ángeles' },
      { municipalityId: muniMap['Jesús Enrique Lossada'], name: 'La Concepción' },
      { municipalityId: muniMap['Jesús Enrique Lossada'], name: 'San José' },
      { municipalityId: muniMap['Jesús María Semprún'], name: 'Jesús María Semprún' },
      { municipalityId: muniMap['Jesús María Semprún'], name: 'Barí' },
      { municipalityId: muniMap['La Cañada de Urdaneta'], name: 'Concepción' },
      { municipalityId: muniMap['La Cañada de Urdaneta'], name: 'Andrés Bello' },
      { municipalityId: muniMap['La Cañada de Urdaneta'], name: 'Chiquinquirá' },
      { municipalityId: muniMap['La Cañada de Urdaneta'], name: 'El Carmelo' },
      { municipalityId: muniMap['La Cañada de Urdaneta'], name: 'Potreritos' },
      { municipalityId: muniMap['Lagunillas'], name: 'Alonso de Ojeda' },
      { municipalityId: muniMap['Lagunillas'], name: 'Campo Lara' },
      { municipalityId: muniMap['Lagunillas'], name: 'Eleazar López Contreras' },
      { municipalityId: muniMap['Lagunillas'], name: 'Francisco Javier Pulgar' },
      { municipalityId: muniMap['Lagunillas'], name: 'Libertad' },
      { municipalityId: muniMap['Lagunillas'], name: 'Venezuela' },
      { municipalityId: muniMap['Machiques de Perijá'], name: 'Machiques' },
      { municipalityId: muniMap['Machiques de Perijá'], name: 'Bartolomé de las Casas' },
      { municipalityId: muniMap['Machiques de Perijá'], name: 'Libertad' },
      { municipalityId: muniMap['Machiques de Perijá'], name: 'Río Negro' },
      { municipalityId: muniMap['Machiques de Perijá'], name: 'San José de Perijá' },
      { municipalityId: muniMap['Mara'], name: 'Bolívar' },
      { municipalityId: muniMap['Mara'], name: 'Guadalupe' },
      { municipalityId: muniMap['Mara'], name: 'La Sierrita' },
      { municipalityId: muniMap['Mara'], name: 'San Rafael' },
      { municipalityId: muniMap['Mara'], name: 'Ricaurte' },
      { municipalityId: muniMap['Maracaibo'], name: 'Antonio Borjas Romero' },
      { municipalityId: muniMap['Maracaibo'], name: 'Bolívar' },
      { municipalityId: muniMap['Maracaibo'], name: 'Cacique Mara' },
      { municipalityId: muniMap['Maracaibo'], name: 'Carracciolo Parra Pérez' },
      { municipalityId: muniMap['Maracaibo'], name: 'Cecilio Acosta' },
      { municipalityId: muniMap['Maracaibo'], name: 'Cristo de Aranza' },
      { municipalityId: muniMap['Maracaibo'], name: 'Coquivacoa' },
      { municipalityId: muniMap['Maracaibo'], name: 'Chiquinquirá' },
      { municipalityId: muniMap['Maracaibo'], name: 'Francisco Eugenio Bustamante' },
      { municipalityId: muniMap['Maracaibo'], name: 'Idelfonso Vásquez' },
      { municipalityId: muniMap['Maracaibo'], name: 'Juana de Ávila' },
      { municipalityId: muniMap['Maracaibo'], name: 'Luis Hurtado Higuera' },
      { municipalityId: muniMap['Maracaibo'], name: 'Manuel Dagnino' },
      { municipalityId: muniMap['Maracaibo'], name: 'Olegario Villalobos' },
      { municipalityId: muniMap['Maracaibo'], name: 'Raúl Leoni' },
      { municipalityId: muniMap['Maracaibo'], name: 'Santa Lucía' },
      { municipalityId: muniMap['Maracaibo'], name: 'San Isidro' },
      { municipalityId: muniMap['Maracaibo'], name: 'Venancio Pulgar' },
      { municipalityId: muniMap['Miranda'], name: 'Alta Guajira' },
      { municipalityId: muniMap['Miranda'], name: 'San José' },
      { municipalityId: muniMap['Miranda'], name: 'Ana María Campos' },
      { municipalityId: muniMap['Miranda'], name: 'Faría' },
      { municipalityId: muniMap['Miranda'], name: 'Monagas' },
      { municipalityId: muniMap['Rosario de Perijá'], name: 'El Rosario' },
      { municipalityId: muniMap['Rosario de Perijá'], name: 'Sixto Zambrano' },
      { municipalityId: muniMap['Rosario de Perijá'], name: 'Nueva Estación' },
      { municipalityId: muniMap['San Francisco'], name: 'San Francisco' },
      { municipalityId: muniMap['San Francisco'], name: 'El Bajo' },
      { municipalityId: muniMap['San Francisco'], name: 'Domitila Flores' },
      { municipalityId: muniMap['San Francisco'], name: 'Francisco Ochoa' },
      { municipalityId: muniMap['San Francisco'], name: 'Los Cortijos' },
      { municipalityId: muniMap['San Francisco'], name: 'Marcial Hernández' },
      { municipalityId: muniMap['San Francisco'], name: 'José Domingo Rus' },
      { municipalityId: muniMap['Santa Rita'], name: 'Santa Rita' },
      { municipalityId: muniMap['Santa Rita'], name: 'El Menito' },
      { municipalityId: muniMap['Santa Rita'], name: 'José Cenobio Urribarrí' },
      { municipalityId: muniMap['Simón Bolívar'], name: 'Manuel Manrique' },
      { municipalityId: muniMap['Simón Bolívar'], name: 'Rafael María Baralt' },
      { municipalityId: muniMap['Simón Bolívar'], name: 'Miguel Isidro Niñez' },
      { municipalityId: muniMap['Sucre'], name: 'Sucre' },
      { municipalityId: muniMap['Sucre'], name: 'Rómulo Gallegos' },
      { municipalityId: muniMap['Sucre'], name: 'San José' },
      { municipalityId: muniMap['Valmore Rodríguez'], name: 'Rafael Urdaneta' },
      { municipalityId: muniMap['Valmore Rodríguez'], name: 'La Victoria' },
      { municipalityId: muniMap['Valmore Rodríguez'], name: 'Raúl Cuenca' },
    ],
  });
  console.log('Ubicaciones creadas.');

  const password = await bcrypt.hash('123456', 10);
  const adminPassword = await bcrypt.hash('admin', 10);

  // ── 3. PERSONS ──
  const usedCIs = new Set<number>();

  function generateCI(): string {
    let ci: number;
    do { ci = randInt(25000000, 32000000); } while (usedCIs.has(ci));
    usedCIs.add(ci);
    return `V-${ci}`;
  }

  // Staff persons (1-19)
  const staffPersons = [
    // Existing staff
    { id: 1, firstNames: 'Luisangel', lastNames: 'Ugaz', identificationNumber: 'V-12345678', birthDate: new Date('1990-01-01'), gender: 'Masculino' },
    { id: 2, firstNames: 'Daniela', lastNames: 'Quintero', identificationNumber: 'V-87654321', birthDate: new Date('1985-05-15'), gender: 'Femenino' },
    { id: 3, firstNames: 'Yujenis', lastNames: 'Gonzalez', identificationNumber: 'V-11223344', birthDate: new Date('1982-03-20'), gender: 'Femenino' },
    { id: 4, firstNames: 'Yorhjan', lastNames: 'Fuentes', identificationNumber: 'V-99887766', birthDate: new Date('1988-07-10'), gender: 'Masculino' },
    { id: 5, firstNames: 'Yasmeli', lastNames: 'Villalobos', identificationNumber: 'V-55443322', birthDate: new Date('1992-11-25'), gender: 'Femenino' },
    { id: 7, firstNames: 'Diana', lastNames: 'Pereira', identificationNumber: 'V-11122233', birthDate: new Date('1987-08-22'), gender: 'Femenino' },
  ];

  // Student persons (20-29)
  const STUDENT_PERSON_START = 20;
  const TOTAL_STUDENTS = 10;

  const studentPersons: { id: number; firstNames: string; lastNames: string; identificationNumber: string; birthDate: Date; gender: string }[] = [
    { id: 20, firstNames: 'Carlos', lastNames: 'Pérez Rodríguez', identificationNumber: generateCI(), birthDate: new Date(2009, 2, 10), gender: 'Masculino' },
    { id: 21, firstNames: 'María', lastNames: 'López Hernández', identificationNumber: generateCI(), birthDate: new Date(2008, 5, 15), gender: 'Femenino' },
    { id: 22, firstNames: 'José', lastNames: 'Rodríguez López', identificationNumber: generateCI(), birthDate: new Date(2008, 8, 20), gender: 'Masculino' },
    { id: 23, firstNames: 'Ana', lastNames: 'Rodríguez López', identificationNumber: generateCI(), birthDate: new Date(2009, 1, 5), gender: 'Femenino' },
    { id: 24, firstNames: 'Luis', lastNames: 'Martínez Torres', identificationNumber: generateCI(), birthDate: new Date(2008, 3, 12), gender: 'Masculino' },
    { id: 25, firstNames: 'Carmen', lastNames: 'Hernández Díaz', identificationNumber: generateCI(), birthDate: new Date(2007, 7, 25), gender: 'Femenino' },
    { id: 26, firstNames: 'Miguel', lastNames: 'Torres Mendoza', identificationNumber: generateCI(), birthDate: new Date(2006, 11, 30), gender: 'Masculino' },
    { id: 27, firstNames: 'Sofía', lastNames: 'Díaz Castro', identificationNumber: generateCI(), birthDate: new Date(2007, 4, 18), gender: 'Femenino' },
    { id: 28, firstNames: 'Diego', lastNames: 'Mendoza Rivas', identificationNumber: generateCI(), birthDate: new Date(2005, 9, 22), gender: 'Masculino' },
    { id: 29, firstNames: 'Valentina', lastNames: 'Castro Mendoza', identificationNumber: generateCI(), birthDate: new Date(2006, 6, 14), gender: 'Femenino' },
  ];

  // Representative persons (30-38)
  const REP_COUNT = 9;
  const REP_PERSON_START = 30;

  const repPersons: { id: number; firstNames: string; lastNames: string; identificationNumber: string; birthDate: Date; gender: string }[] = [
    { id: 30, firstNames: 'Marta', lastNames: 'Rodríguez López', identificationNumber: generateCI(), birthDate: new Date(1985, 3, 10), gender: 'Femenino' },
    { id: 31, firstNames: 'Juan', lastNames: 'Pérez García', identificationNumber: generateCI(), birthDate: new Date(1980, 7, 22), gender: 'Masculino' },
    { id: 32, firstNames: 'Laura', lastNames: 'López Martínez', identificationNumber: generateCI(), birthDate: new Date(1983, 11, 5), gender: 'Femenino' },
    { id: 33, firstNames: 'Pedro', lastNames: 'Martínez Torres', identificationNumber: generateCI(), birthDate: new Date(1982, 5, 15), gender: 'Masculino' },
    { id: 34, firstNames: 'Ana', lastNames: 'Hernández Díaz', identificationNumber: generateCI(), birthDate: new Date(1986, 1, 28), gender: 'Femenino' },
    { id: 35, firstNames: 'Carlos', lastNames: 'Torres Rivas', identificationNumber: generateCI(), birthDate: new Date(1981, 9, 12), gender: 'Masculino' },
    { id: 36, firstNames: 'Rosa', lastNames: 'Díaz Castro', identificationNumber: generateCI(), birthDate: new Date(1984, 6, 8), gender: 'Femenino' },
    { id: 37, firstNames: 'José', lastNames: 'Mendoza Rivas', identificationNumber: generateCI(), birthDate: new Date(1979, 2, 20), gender: 'Masculino' },
    { id: 38, firstNames: 'María', lastNames: 'Castro Mendoza', identificationNumber: generateCI(), birthDate: new Date(1982, 8, 25), gender: 'Femenino' },
  ];

  // New docente persons (420-439)
  const docentePersons = [
    { id: 420, firstNames: 'Dionel', lastNames: 'Silva', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 421, firstNames: 'Jean', lastNames: 'Cambar', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 422, firstNames: 'Domingo', lastNames: 'Arroyo', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 423, firstNames: 'Leonel', lastNames: 'Madueño', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 424, firstNames: 'Manuel', lastNames: 'Romero', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 425, firstNames: 'Engelberth', lastNames: 'Sanchez', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 426, firstNames: 'Luis', lastNames: 'Duran', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 427, firstNames: 'Maria', lastNames: 'Maturana', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Femenino' },
    { id: 428, firstNames: 'Edyoly', lastNames: 'Valbuena', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Femenino' },
    { id: 429, firstNames: 'Yldelfonso', lastNames: 'Vasquez', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 430, firstNames: 'Luis', lastNames: 'Urdaneta', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 431, firstNames: 'Pedro', lastNames: 'Orozco', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 432, firstNames: 'Nelvis', lastNames: 'Zambrano', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Femenino' },
    { id: 433, firstNames: 'Jose Raul', lastNames: 'Jimenez', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 434, firstNames: 'Geryk', lastNames: 'Nuñez', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 435, firstNames: 'Betty', lastNames: 'Chacín', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Femenino' },
    { id: 436, firstNames: 'Dameris', lastNames: 'Peña', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Femenino' },
    { id: 437, firstNames: 'Yralina', lastNames: 'Quintero', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Femenino' },
    { id: 438, firstNames: 'Jesus', lastNames: 'Erdenes', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 439, firstNames: 'Luis Angel', lastNames: 'Ugaz', identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
  ];

  await prisma.person.createMany({ data: [...staffPersons, ...studentPersons, ...repPersons, ...docentePersons] });
  console.log('Personas creadas.');

  // ── 4. USERS ──
  const staffUserData = [
    { id: 1, personId: 1, email: 'admin@admin.com', password: adminPassword, phone: '0412-1111111', status: true },
    { id: 2, personId: 2, email: 'directora@colegio.com', password, phone: '0412-2222222', status: true },
    { id: 3, personId: 3, email: 'subdirector@colegio.com', password, phone: '0412-3333333', status: true },
    { id: 4, personId: 4, email: 'contador@colegio.com', password, phone: '0412-4444444', status: true },
    { id: 5, personId: 5, email: 'control@colegio.com', password, phone: '0412-5555555', status: true },
    { id: 7, personId: 7, email: 'diana@pereira.com', password: adminPassword, phone: '0412-7777777', status: true },
    { id: 150, personId: 420, email: 'dionel.silva@colegio.com', password, phone: '0412-1500000', status: true },
    { id: 151, personId: 421, email: 'jean.cambar@colegio.com', password, phone: '0412-1510000', status: true },
    { id: 152, personId: 422, email: 'domingo.arroyo@colegio.com', password, phone: '0412-1520000', status: true },
    { id: 153, personId: 423, email: 'leonel.madueno@colegio.com', password, phone: '0412-1530000', status: true },
    { id: 154, personId: 424, email: 'manuel.romero@colegio.com', password, phone: '0412-1540000', status: true },
    { id: 155, personId: 425, email: 'engelberth.sanchez@colegio.com', password, phone: '0412-1550000', status: true },
    { id: 156, personId: 426, email: 'luis.duran@colegio.com', password, phone: '0412-1560000', status: true },
    { id: 157, personId: 427, email: 'maria.maturana@colegio.com', password, phone: '0412-1570000', status: true },
    { id: 158, personId: 428, email: 'edyoly.valbuena@colegio.com', password, phone: '0412-1580000', status: true },
    { id: 159, personId: 429, email: 'yldelfonso.vasquez@colegio.com', password, phone: '0412-1590000', status: true },
    { id: 160, personId: 430, email: 'luis.urdaneta@colegio.com', password, phone: '0412-1600000', status: true },
    { id: 161, personId: 431, email: 'pedro.orozco@colegio.com', password, phone: '0412-1610000', status: true },
    { id: 162, personId: 432, email: 'nelvis.zambrano@colegio.com', password, phone: '0412-1620000', status: true },
    { id: 163, personId: 433, email: 'joseraul.jimenez@colegio.com', password, phone: '0412-1630000', status: true },
    { id: 164, personId: 434, email: 'geryk.nunez@colegio.com', password, phone: '0412-1640000', status: true },
    { id: 165, personId: 435, email: 'betty.chacin@colegio.com', password, phone: '0412-1650000', status: true },
    { id: 166, personId: 436, email: 'dameris.pena@colegio.com', password, phone: '0412-1660000', status: true },
    { id: 167, personId: 437, email: 'yralina.quintero@colegio.com', password, phone: '0412-1670000', status: true },
    { id: 168, personId: 438, email: 'jesus.erdenes@colegio.com', password, phone: '0412-1680000', status: true },
    { id: 169, personId: 439, email: 'luisangel.docente@colegio.com', password, phone: '0412-1690000', status: true },
  ];
  await prisma.user.createMany({ data: staffUserData });

  const repUsersData = repPersons.map((p, i) => ({
    id: 10 + i,
    personId: p.id,
    email: `representante${i + 1}@correo.com`,
    password,
    phone: `0412-${String(1000000 + i).slice(1)}`,
    status: true,
  }));
  await prisma.user.createMany({ data: repUsersData });

  // UserRoles
  const staffRoleMap: [number, number[]][] = [
    [1, [1]], [2, [2]], [3, [3]], [4, [4]], [5, [5, 6]], [7, [1]],
  ];
  for (let id = 150; id <= 169; id++) {
    staffRoleMap.push([id, [6]]);
  }

  const userRoleData = [
    ...staffRoleMap.flatMap(([userId, roleIds]) =>
      roleIds.map((roleId) => ({ userId, roleId }))
    ),
    ...repUsersData.map((u) => ({ userId: u.id, roleId: 7 })),
  ];
  await prisma.userRole.createMany({ data: userRoleData });
  console.log('Usuarios creados.');

  // ── 5. STUDENTS ──
  const addressOptions = ['Calle 5 de Julio', 'Av. 15 con Calle 10', 'Urb. Las Delicias', 'Sector El Milagro', 'Barrio San José', 'Av. La Limpia', 'Calle 77', 'Urb. Veritas', 'Sector 3 de Mayo', 'Parroquia Olegario Villalobos'];

  const studentsData = studentPersons.map((p, i) => ({
    personId: p.id,
    birthCountry: 'Venezuela',
    state: 'Zulia',
    municipality: 'Maracaibo',
    parish: 'Bolívar',
    currentParish: 'Bolívar',
    address: addressOptions[i % addressOptions.length] + ' #' + (i + 1),
    status: true,
    admissionDate: new Date('2026-07-01'),
  }));
  await prisma.student.createMany({ data: studentsData });
  console.log('Estudiantes creados.');

  const allStudents = await prisma.student.findMany({ orderBy: { id: 'asc' } });

  // ── 6. REPRESENTATIVES ──
  const repUsers = await prisma.user.findMany({ where: { userRoles: { some: { role: { role: 'Representante' } } } }, orderBy: { id: 'asc' } });
  const repRecords = repUsers.map((u) => ({
    userId: u.id,
    occupation: pick(occupations),
  }));
  await prisma.representative.createMany({ data: repRecords });
  console.log('Representantes creados.');

  const representatives = await prisma.representative.findMany({ orderBy: { id: 'asc' } });

  // Build rep-user-person map
  const repUserMap = new Map<number, typeof repUsers[0]>();
  for (const ru of repUsers) {
    repUserMap.set(ru.id, ru);
  }
  const repPersonMap = new Map<number, typeof repPersons[0]>();
  for (const rp of repPersons) {
    repPersonMap.set(rp.id, rp);
  }

  // ── 7. STUDENT-REPRESENTATIVE ASSIGNMENT ──
  // 9 reps: rep0 (Marta) → Estudiantes 3+4 (José & Ana, hermanos), demás → 1 estudiante cada uno
  // Student order: 0=Carlos(1A), 1=María(1B), 2=José(2A), 3=Ana(2B), 4=Luis(3A), 5=Carmen(3B),
  //                6=Miguel(4A), 7=Sofía(4B), 8=Diego(5A), 9=Valentina(5B)
  const studentRepPairs: { studentId: number; representativeId: number; relationship: string; isPrimary: boolean }[] = [
    { studentId: 0, representativeId: representatives[1].id, relationship: 'Padre', isPrimary: true },   // → Student 1 (Carlos)
    { studentId: 0, representativeId: representatives[2].id, relationship: 'Madre', isPrimary: true },   // → Student 2 (María)
    { studentId: 0, representativeId: representatives[0].id, relationship: 'Madre', isPrimary: true },   // → Student 3 (José, hermano)
    { studentId: 0, representativeId: representatives[0].id, relationship: 'Madre', isPrimary: false },  // → Student 4 (Ana, hermana)
    { studentId: 0, representativeId: representatives[3].id, relationship: 'Padre', isPrimary: true },   // → Student 5 (Luis)
    { studentId: 0, representativeId: representatives[4].id, relationship: 'Madre', isPrimary: true },   // → Student 6 (Carmen)
    { studentId: 0, representativeId: representatives[5].id, relationship: 'Padre', isPrimary: true },   // → Student 7 (Miguel)
    { studentId: 0, representativeId: representatives[6].id, relationship: 'Madre', isPrimary: true },   // → Student 8 (Sofía)
    { studentId: 0, representativeId: representatives[7].id, relationship: 'Padre', isPrimary: true },   // → Student 9 (Diego)
    { studentId: 0, representativeId: representatives[8].id, relationship: 'Madre', isPrimary: true },   // → Student 10 (Valentina)
  ];

  // Assign actual student IDs
  for (let i = 0; i < allStudents.length; i++) {
    studentRepPairs[i].studentId = allStudents[i].id;
  }

  await prisma.studentRepresentative.createMany({ data: studentRepPairs });
  console.log('Relaciones estudiante-representante creadas.');

  // Build student → primary rep map for payment bundling
  const studentPrimaryRepMap = new Map<number, number>();
  for (const pair of studentRepPairs) {
    if (pair.isPrimary) {
      studentPrimaryRepMap.set(pair.studentId, pair.representativeId);
    }
  }

  // ── 8. EMPLOYEES ──
  await prisma.employee.createMany({
    data: [
      { userId: 2, baseHourRate: 0, hireDate: new Date('2020-01-15') },
      { userId: 3, baseHourRate: 0, hireDate: new Date('2021-03-01') },
      { userId: 4, baseHourRate: 0, hireDate: new Date('2022-06-01') },
      { userId: 5, baseHourRate: 0, hireDate: new Date('2023-09-01') },
      // Named docentes (150-169)
      { userId: 150, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 151, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 152, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 153, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 154, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 155, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 156, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 157, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 158, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 159, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 160, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 161, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 162, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 163, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 164, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 165, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 166, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 167, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 168, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
      { userId: 169, baseHourRate: 12.5, hireDate: new Date('2024-09-01') },
    ],
  });
  console.log('Empleados creados.');

  // ── 9. HIGH SCHOOL LEVELS ──
  await prisma.highSchoolLevel.createMany({
    data: [
      { id: 1, level: '1er Año' },
      { id: 2, level: '2do Año' },
      { id: 3, level: '3er Año' },
      { id: 4, level: '4to Año' },
      { id: 5, level: '5to Año' },
    ],
  });
  console.log('Niveles creados.');

  // ── 10. SUBJECTS ──
  const subjectsData = [
    { id: 1, subject: 'Lengua y Literatura', code: 'LYL', status: true },
    { id: 2, subject: 'Idiomas', code: 'IDI', status: true },
    { id: 3, subject: 'Matemáticas', code: 'MAT', status: true },
    { id: 4, subject: 'Educación Física', code: 'EF', status: true },
    { id: 5, subject: 'Arte y Patrimonio', code: 'AP', status: true },
    { id: 6, subject: 'Biología Ambiente y Tecnología', code: 'BAT', status: true },
    { id: 7, subject: 'Geografía Historia y Ciudadanía', code: 'GHC', status: true },
    { id: 8, subject: 'Física', code: 'FIS', status: true },
    { id: 9, subject: 'Química', code: 'QUI', status: true },
    { id: 10, subject: 'Formación para la Soberanía Nacional', code: 'FSN', status: true },
    { id: 11, subject: 'Ciencias de la Tierra', code: 'CT', status: true },
    { id: 12, subject: 'Robótica', code: 'ROB', status: true },
    { id: 13, subject: 'Música', code: 'MUS', status: true },
    { id: 14, subject: 'CRP', code: 'CRP', status: true },
    { id: 15, subject: 'Orientación Vocacional', code: 'OV', status: true },
    { id: 16, subject: 'Metodología', code: 'MET', status: true },
  ];
  await prisma.subject.createMany({ data: subjectsData });
  console.log('Materias creadas.');

  // ── 11. LEVEL SUBJECTS ──
  const levelSubjectsData = [
    // 1er Año
    { highSchoolLevelId: 1, subjectId: 1 },
    { highSchoolLevelId: 1, subjectId: 2 },
    { highSchoolLevelId: 1, subjectId: 3 },
    { highSchoolLevelId: 1, subjectId: 4 },
    { highSchoolLevelId: 1, subjectId: 5 },
    { highSchoolLevelId: 1, subjectId: 6 },
    { highSchoolLevelId: 1, subjectId: 7 },
    { highSchoolLevelId: 1, subjectId: 12 },
    { highSchoolLevelId: 1, subjectId: 13 },
    { highSchoolLevelId: 1, subjectId: 14 },
    { highSchoolLevelId: 1, subjectId: 15 },
    // 2do Año
    { highSchoolLevelId: 2, subjectId: 1 },
    { highSchoolLevelId: 2, subjectId: 2 },
    { highSchoolLevelId: 2, subjectId: 3 },
    { highSchoolLevelId: 2, subjectId: 4 },
    { highSchoolLevelId: 2, subjectId: 5 },
    { highSchoolLevelId: 2, subjectId: 6 },
    { highSchoolLevelId: 2, subjectId: 7 },
    { highSchoolLevelId: 2, subjectId: 12 },
    { highSchoolLevelId: 2, subjectId: 13 },
    { highSchoolLevelId: 2, subjectId: 14 },
    { highSchoolLevelId: 2, subjectId: 15 },
    // 3er Año
    { highSchoolLevelId: 3, subjectId: 1 },
    { highSchoolLevelId: 3, subjectId: 2 },
    { highSchoolLevelId: 3, subjectId: 3 },
    { highSchoolLevelId: 3, subjectId: 4 },
    { highSchoolLevelId: 3, subjectId: 6 },
    { highSchoolLevelId: 3, subjectId: 7 },
    { highSchoolLevelId: 3, subjectId: 8 },
    { highSchoolLevelId: 3, subjectId: 9 },
    { highSchoolLevelId: 3, subjectId: 12 },
    { highSchoolLevelId: 3, subjectId: 13 },
    { highSchoolLevelId: 3, subjectId: 14 },
    { highSchoolLevelId: 3, subjectId: 15 },
    // 4to Año
    { highSchoolLevelId: 4, subjectId: 1 },
    { highSchoolLevelId: 4, subjectId: 2 },
    { highSchoolLevelId: 4, subjectId: 3 },
    { highSchoolLevelId: 4, subjectId: 4 },
    { highSchoolLevelId: 4, subjectId: 6 },
    { highSchoolLevelId: 4, subjectId: 7 },
    { highSchoolLevelId: 4, subjectId: 8 },
    { highSchoolLevelId: 4, subjectId: 9 },
    { highSchoolLevelId: 4, subjectId: 10 },
    { highSchoolLevelId: 4, subjectId: 12 },
    { highSchoolLevelId: 4, subjectId: 14 },
    { highSchoolLevelId: 4, subjectId: 15 },
    { highSchoolLevelId: 4, subjectId: 16 },
    // 5to Año
    { highSchoolLevelId: 5, subjectId: 1 },
    { highSchoolLevelId: 5, subjectId: 2 },
    { highSchoolLevelId: 5, subjectId: 3 },
    { highSchoolLevelId: 5, subjectId: 4 },
    { highSchoolLevelId: 5, subjectId: 6 },
    { highSchoolLevelId: 5, subjectId: 7 },
    { highSchoolLevelId: 5, subjectId: 8 },
    { highSchoolLevelId: 5, subjectId: 9 },
    { highSchoolLevelId: 5, subjectId: 10 },
    { highSchoolLevelId: 5, subjectId: 11 },
    { highSchoolLevelId: 5, subjectId: 14 },
    { highSchoolLevelId: 5, subjectId: 15 },
    { highSchoolLevelId: 5, subjectId: 16 },
  ];
  await prisma.levelSubject.createMany({ data: levelSubjectsData });
  console.log('Materias por nivel creadas.');

  // ── 12. SCHOOL YEAR ──
  await prisma.schoolYear.createMany({
    data: [
      { id: 1, name: '2026-2027', startDate: new Date('2026-07-01'), endDate: new Date('2027-06-30'), isActive: true },
    ],
  });
  console.log('Año escolar creado.');

  // ── 13. PERIODS ──
  await prisma.period.createMany({
    data: [
      { id: 1, schoolYearId: 1, period: 'Lapso I', startDate: new Date('2026-09-15'), endDate: new Date('2026-12-18') },
      { id: 2, schoolYearId: 1, period: 'Lapso II', startDate: new Date('2027-01-12'), endDate: new Date('2027-04-09') },
      { id: 3, schoolYearId: 1, period: 'Lapso III', startDate: new Date('2027-04-12'), endDate: new Date('2027-06-30') },
    ],
  });
  console.log('Períodos creados.');

  // ── 13b. EVALUATION TYPES ──
  await prisma.evaluationType.createMany({
    data: [
      { id: 1, evaluationType: 'Examen' },
      { id: 2, evaluationType: 'Tarea' },
      { id: 3, evaluationType: 'Participación' },
      { id: 4, evaluationType: 'Proyecto' },
      { id: 5, evaluationType: 'Práctica' },
      { id: 6, evaluationType: 'Trabajo en Equipo' },
      { id: 7, evaluationType: 'Quiz' },
      { id: 8, evaluationType: 'Investigación' },
      { id: 9, evaluationType: 'Exposición' },
      { id: 10, evaluationType: 'Laboratorio' },
    ],
  });
  console.log('Tipos de evaluación creados.');

  // ── 14. SECTIONS ──
  const sectionData = [
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
  ];
  await prisma.section.createMany({ data: sectionData });
  console.log('Secciones creadas.');

  const sections = await prisma.section.findMany({ orderBy: { id: 'asc' } });

  // ── 15. ENROLLMENTS ──
  const enrollmentsData: { studentId: number; schoolYearId: number; sectionId: number; enrollmentDate: Date; status: boolean }[] = [];

  for (let i = 0; i < allStudents.length; i++) {
    // sectionId 1-10 maps to sections 1A-5B
    enrollmentsData.push({
      studentId: allStudents[i].id,
      schoolYearId: 1,
      sectionId: i + 1,
      enrollmentDate: new Date('2026-09-15'),
      status: true,
    });
  }

  await prisma.studentEnrollment.createMany({ data: enrollmentsData });
  console.log('Matrículas oficiales creadas.');

  // ── 16. TEACHING GROUPS ──
  const allSections = await prisma.section.findMany();
  const allLevelSubjects = await prisma.levelSubject.findMany();
  const allEmployees = await prisma.employee.findMany();
  const allSchoolYears = await prisma.schoolYear.findMany();

  // Build employeeId → userId lookup
  const employeeUserIdMap = new Map<number, number>();
  const employeeByUserId = new Map<number, number>();
  for (const emp of allEmployees) {
    employeeUserIdMap.set(emp.id, emp.userId);
    employeeByUserId.set(emp.userId, emp.id);
  }

  // LevelSubject map: (highSchoolLevelId, subjectId) → LevelSubject
  const lsMap = new Map<string, (typeof allLevelSubjects)[0]>();
  for (const ls of allLevelSubjects) {
    lsMap.set(`${ls.highSchoolLevelId}-${ls.subjectId}`, ls);
  }

  // Section map: (highSchoolLevelId, section) → Section
  const sectionMap = new Map<string, (typeof allSections)[0]>();
  for (const s of allSections) {
    sectionMap.set(`${s.highSchoolLevelId}-${s.section}`, s);
  }

  // ── Teacher mapping: (subjectId, levelId) → userId ──
  const teacherMap = new Map<string, number>();
  // LYL (1)
  teacherMap.set('1-1', 150); teacherMap.set('2-1', 150); teacherMap.set('3-1', 150);
  teacherMap.set('4-1', 151); teacherMap.set('5-1', 151);
  // IDI (2)
  [1, 2, 3, 4, 5].forEach(l => teacherMap.set(`${l}-2`, 152));
  // MAT (3)
  teacherMap.set('1-3', 153); teacherMap.set('2-3', 153);
  teacherMap.set('3-3', 154); teacherMap.set('4-3', 154); teacherMap.set('5-3', 154);
  // EF (4)
  teacherMap.set('1-4', 155); teacherMap.set('2-4', 155); teacherMap.set('3-4', 155);
  teacherMap.set('4-4', 156); teacherMap.set('5-4', 156);
  // AP (5)
  teacherMap.set('1-5', 157); teacherMap.set('2-5', 157);
  // BAT (6)
  teacherMap.set('1-6', 158); teacherMap.set('2-6', 158); teacherMap.set('5-6', 158);
  teacherMap.set('3-6', 159); teacherMap.set('4-6', 159);
  // GHC (7)
  teacherMap.set('1-7', 157); teacherMap.set('2-7', 160);
  teacherMap.set('3-7', 161); teacherMap.set('4-7', 161); teacherMap.set('5-7', 161);
  // FIS (8)
  teacherMap.set('3-8', 153); teacherMap.set('4-8', 154); teacherMap.set('5-8', 5);
  // QUI (9)
  [3, 4, 5].forEach(l => teacherMap.set(`${l}-9`, 162));
  // FSN (10)
  teacherMap.set('4-10', 161); teacherMap.set('5-10', 161);
  // CT (11)
  teacherMap.set('5-11', 160);

  const teachingGroupData: any[] = [];

  // Regular subjects (isSpecialGroup=false)
  for (const [key, userId] of teacherMap) {
    const [levelId, subjectId] = key.split('-').map(Number);
    const ls = lsMap.get(`${levelId}-${subjectId}`);
    if (!ls) continue;
    const empId = employeeByUserId.get(userId);
    if (!empId) continue;
    const levelSections = allSections.filter(s => s.highSchoolLevelId === levelId);
    for (const section of levelSections) {
      teachingGroupData.push({
        teacherId: empId,
        levelSubjectId: ls.id,
        schoolYearId: 1,
        sectionId: section.id,
        isSpecialGroup: false,
        assignedAt: new Date('2026-09-01'),
        status: true,
      });
    }
  }

  // ROB (12) — isSpecialGroup
  for (const levelId of [1, 2, 3, 4]) {
    const ls = lsMap.get(`${levelId}-12`);
    if (!ls) continue;
    const empId = employeeByUserId.get(164);
    if (!empId) continue;
    const levelSections = allSections.filter(s => s.highSchoolLevelId === levelId);
    for (const section of levelSections) {
      teachingGroupData.push({
        teacherId: empId,
        levelSubjectId: ls.id,
        schoolYearId: 1,
        sectionId: section.id,
        isSpecialGroup: true,
        assignedAt: new Date('2026-09-01'),
        status: true,
      });
    }
  }

  // MUS (13) — isSpecialGroup
  for (const levelId of [1, 2, 3]) {
    const ls = lsMap.get(`${levelId}-13`);
    if (!ls) continue;
    const empId = employeeByUserId.get(163);
    if (!empId) continue;
    const levelSections = allSections.filter(s => s.highSchoolLevelId === levelId);
    for (const section of levelSections) {
      teachingGroupData.push({
        teacherId: empId,
        levelSubjectId: ls.id,
        schoolYearId: 1,
        sectionId: section.id,
        isSpecialGroup: true,
        assignedAt: new Date('2026-09-01'),
        status: true,
      });
    }
  }

  // OV (15) — isSpecialGroup, per-section teacher assignment
  const ovTeacherMap: Record<string, number> = {
    '1-A': 150, '1-B': 157, '2-A': 160, '2-B': 163,
    '3-A': 153, '3-B': 154, '4-A': 162, '4-B': 159,
    '5-A': 161, '5-B': 158,
  };
  for (const [sectionKey, userId] of Object.entries(ovTeacherMap)) {
    const levelId = Number(sectionKey[0]);
    const sectionLetter = sectionKey[2];
    const ls = lsMap.get(`${levelId}-15`);
    if (!ls) continue;
    const section = sectionMap.get(`${levelId}-${sectionLetter}`);
    if (!section) continue;
    const empId = employeeByUserId.get(userId);
    if (!empId) continue;
    teachingGroupData.push({
      teacherId: empId,
      levelSubjectId: ls.id,
      schoolYearId: 1,
      sectionId: section.id,
      isSpecialGroup: true,
      assignedAt: new Date('2026-09-01'),
      status: true,
    });
  }

  // MET (16) — isSpecialGroup
  for (const levelId of [4, 5]) {
    const ls = lsMap.get(`${levelId}-16`);
    if (!ls) continue;
    const empId = employeeByUserId.get(150);
    if (!empId) continue;
    const levelSections = allSections.filter(s => s.highSchoolLevelId === levelId);
    for (const section of levelSections) {
      teachingGroupData.push({
        teacherId: empId,
        levelSubjectId: ls.id,
        schoolYearId: 1,
        sectionId: section.id,
        isSpecialGroup: true,
        assignedAt: new Date('2026-09-01'),
        status: true,
      });
    }
  }

  await prisma.teachingGroup.createMany({ data: teachingGroupData });
  console.log(`Grupos docentes creados (${teachingGroupData.length}).`);

  // ── 16b. CRP TEACHING GROUPS ──
  const crpNames = [
    'Accesorios y Textiles', 'Ajedrez', 'Bordado Punto de Cruz', 'Danza', 'Futbol I',
    'Gastronomia', 'Guardaparques', 'Guia Turistico', 'Ingles Est y Div', 'Karatedo',
    'Musica', 'Periodismo', 'Piñateria', 'Piñateria II', 'Pintura', 'Productos Quimicos',
    'Salsa Casino', 'Tecnologias Emergentes',
  ];
  const crpUserIdMap: Record<string, { userId: number; active: boolean }> = {
    'Accesorios y Textiles': { userId: 158, active: true },
    'Ajedrez': { userId: 153, active: true },
    'Bordado Punto de Cruz': { userId: 165, active: true },
    'Danza': { userId: 166, active: true },
    'Futbol I': { userId: 155, active: true },
    'Gastronomia': { userId: 3, active: true },
    'Guardaparques': { userId: 159, active: true },
    'Guia Turistico': { userId: 161, active: true },
    'Ingles Est y Div': { userId: 152, active: true },
    'Karatedo': { userId: 169, active: true },
    'Musica': { userId: 163, active: true },
    'Periodismo': { userId: 150, active: true },
    'Piñateria': { userId: 5, active: true },
    'Piñateria II': { userId: 5, active: false },
    'Pintura': { userId: 167, active: true },
    'Productos Quimicos': { userId: 162, active: true },
    'Salsa Casino': { userId: 168, active: true },
    'Tecnologias Emergentes': { userId: 164, active: true },
  };

  const crpLevelSubjects = await prisma.levelSubject.findMany({
    where: { subject: { code: 'CRP' } },
  });

  if (crpLevelSubjects.length > 0) {
    const crpData: any[] = [];
    for (const [name, config] of Object.entries(crpUserIdMap)) {
      const empId = employeeByUserId.get(config.userId);
      if (!empId) continue;
      for (const ls of crpLevelSubjects) {
        crpData.push({
          teacherId: empId,
          levelSubjectId: ls.id,
          schoolYearId: 1,
          sectionId: null,
          groupName: name,
          isSpecialGroup: true,
          assignedAt: new Date('2026-09-01'),
          status: config.active,
        });
      }
    }
    await prisma.teachingGroup.createMany({ data: crpData });
    console.log(`Grupos CRP creados (${crpData.length}).`);
  } else {
    console.log('⚠️ No se encontraron materias CRP.');
  }

  // ── 16c. STUDENT TEACHING GROUPS + EVALUATIONS + GRADES ──
  // For each student: link to all regular/special TGs for their section + 1 random CRP
  const allEnrollments = await prisma.studentEnrollment.findMany({
    where: { status: true },
    include: { section: { include: { highSchoolLevel: true } } },
  });

  // Find all TGs for this school year
  const allTGs = await prisma.teachingGroup.findMany({
    where: { schoolYearId: 1 },
    include: { levelSubject: { include: { highSchoolLevel: true } } },
  });

  // Group TGs by sectionId for regular/special TGs
  const regularTGsBySection = new Map<number, typeof allTGs>();
  const crpTGsByLevel = new Map<number, typeof allTGs>();
  for (const tg of allTGs) {
    if (tg.sectionId) {
      if (!regularTGsBySection.has(tg.sectionId)) regularTGsBySection.set(tg.sectionId, []);
      regularTGsBySection.get(tg.sectionId)!.push(tg);
    } else {
      // CRP: sectionId is null, group by level
      const levelId = tg.levelSubject.highSchoolLevelId;
      if (!crpTGsByLevel.has(levelId)) crpTGsByLevel.set(levelId, []);
      crpTGsByLevel.get(levelId)!.push(tg);
    }
  }

  // Create StudentTeachingGroups for all students
  const periods = await prisma.period.findMany({ where: { schoolYearId: 1 }, orderBy: { id: 'asc' } });
  const evalType = await prisma.evaluationType.findFirst({ where: { evaluationType: 'Examen' } });

  const stgData: { studentEnrollmentId: number; teachingGroupId: number }[] = [];
  const evalData: { teachingGroupId: number; periodId: number; evaluationTypeId: number; topic: string; percentage: number }[] = [];
  const tgHasStudents = new Set<number>();

  for (const enrollment of allEnrollments) {
    // 1. Link student to ALL regular/special TGs for their section
    const sectionTGs = regularTGsBySection.get(enrollment.sectionId) || [];
    for (const tg of sectionTGs) {
      stgData.push({ studentEnrollmentId: enrollment.id, teachingGroupId: tg.id });
      tgHasStudents.add(tg.id);
    }

    // 2. Link student to ONE random CRP for their level
    const levelId = enrollment.section.highSchoolLevelId;
    const levelCrps = crpTGsByLevel.get(levelId) || [];
    if (levelCrps.length > 0) {
      const randomCrp = levelCrps[randInt(0, levelCrps.length - 1)];
      stgData.push({ studentEnrollmentId: enrollment.id, teachingGroupId: randomCrp.id });
      tgHasStudents.add(randomCrp.id);
    }
  }

  // Now create evaluations for ALL TGs that have students (3 per period per TG)
  const tgEvalMap = new Map<number, typeof periods>();
  for (const tgId of tgHasStudents) {
    for (const period of periods) {
      evalData.push({
        teachingGroupId: tgId,
        periodId: period.id,
        evaluationTypeId: evalType?.id ?? 1,
        topic: `Evaluación ${period.period}`,
        percentage: 100,
      });
    }
  }

  await prisma.studentTeachingGroup.createMany({ data: stgData });
  console.log(`Estudiantes asignados a grupos docentes (${stgData.length} registros).`);

  await prisma.evaluation.createMany({ data: evalData });
  console.log(`Evaluaciones creadas (${evalData.length}).`);

  // Create GradeRecords for all students (one grade per evaluation in their TGs)
  const gradeData: { studentId: number; evaluationId: number; score: number }[] = [];

  // Get all evaluations for TGs with students
  const allEvaluations = await prisma.evaluation.findMany({
    where: { teachingGroupId: { in: Array.from(tgHasStudents) } },
  });

  // Build map: TG ID → evaluations[]
  const evalsByTG = new Map<number, typeof allEvaluations>();
  for (const ev of allEvaluations) {
    if (!evalsByTG.has(ev.teachingGroupId)) evalsByTG.set(ev.teachingGroupId, []);
    evalsByTG.get(ev.teachingGroupId)!.push(ev);
  }

  // For each student, find their TGs and create grades
  for (const enrollment of allEnrollments) {
    const studentTGs = stgData.filter(s => s.studentEnrollmentId === enrollment.id);
    for (const stg of studentTGs) {
      const tgEvals = evalsByTG.get(stg.teachingGroupId) || [];
      for (const ev of tgEvals) {
        gradeData.push({
          studentId: enrollment.studentId,
          evaluationId: ev.id,
          score: randInt(12, 18),
        });
      }
    }
  }

  if (gradeData.length > 0) {
    await prisma.gradeRecord.createMany({ data: gradeData });
  }
  console.log(`Notas creadas (${gradeData.length}).`);

  // ── 17. FEES ──
  // Fee 1: Inscripción $60 (01/07/2026 - 30/06/2027)
  // Fees 2-13: Monthly $90 each (Sep 2026 - Aug 2027)
  const feeDefinitions = [
    { name: 'Inscripción', value: 60, startAt: new Date('2026-07-01'), endAt: new Date('2027-06-30') },
    { name: 'Septiembre', value: 90, startAt: new Date('2026-09-01'), endAt: new Date('2026-09-30') },
    { name: 'Octubre', value: 90, startAt: new Date('2026-10-01'), endAt: new Date('2026-10-31') },
    { name: 'Noviembre', value: 90, startAt: new Date('2026-11-01'), endAt: new Date('2026-11-30') },
    { name: 'Diciembre', value: 90, startAt: new Date('2026-12-01'), endAt: new Date('2026-12-31') },
    { name: 'Enero', value: 90, startAt: new Date('2027-01-01'), endAt: new Date('2027-01-31') },
    { name: 'Febrero', value: 90, startAt: new Date('2027-02-01'), endAt: new Date('2027-02-28') },
    { name: 'Marzo', value: 90, startAt: new Date('2027-03-01'), endAt: new Date('2027-03-31') },
    { name: 'Abril', value: 90, startAt: new Date('2027-04-01'), endAt: new Date('2027-04-30') },
    { name: 'Mayo', value: 90, startAt: new Date('2027-05-01'), endAt: new Date('2027-05-31') },
    { name: 'Junio', value: 90, startAt: new Date('2027-06-01'), endAt: new Date('2027-06-30') },
    { name: 'Julio', value: 90, startAt: new Date('2027-07-01'), endAt: new Date('2027-07-31') },
    { name: 'Agosto', value: 90, startAt: new Date('2027-08-01'), endAt: new Date('2027-08-31') },
  ];

  const feesData = feeDefinitions.map((f, i) => ({
    id: i + 1,
    name: f.name,
    schoolYearId: 1,
    value: f.value,
    createdAt: new Date('2026-07-01'),
    startAt: f.startAt,
    endAt: f.endAt,
  }));
  await prisma.fee.createMany({ data: feesData });
  console.log('Aranceles creados.');

  const FEE_INSCRIPCION = 1;

  // ── 18. PAYMENT TYPES & METHODS ──
  await prisma.paymentType.createMany({
    data: [
      { id: 1, type: 'Pago móvil', currency: 'VES' as $Enums.Currency },
      { id: 2, type: 'Transferencia', currency: 'VES' as $Enums.Currency },
      { id: 3, type: 'Zelle', currency: 'USD' as $Enums.Currency },
      { id: 4, type: 'Efectivo', currency: 'VES' as $Enums.Currency },
    ],
  });
  await prisma.paymentMethod.createMany({
    data: [
      { id: 1, paymentTypeId: 1, active: true },
      { id: 2, paymentTypeId: 2, active: true },
      { id: 3, paymentTypeId: 3, active: true },
      { id: 4, paymentTypeId: 4, active: true },
    ],
  });
  console.log('Tipos y métodos de pago creados.');

  // ── 19. EXCHANGE ──
  const EXCHANGE_RATE = 602.3324;
  await prisma.exchange.createMany({
    data: [
      { id: 1, rate: EXCHANGE_RATE, date: new Date() },
    ],
  });
  console.log('Tasa de cambio creada.');

  // ── 20. PAYMENTS + STUDENT FEES ──
  // Each student gets Inscripción + 3 mensualidades (Sep, Oct, Nov)
  const PAYMENT_FEE_IDS = [FEE_INSCRIPCION, 2, 3, 4]; // Inscripción + Septiembre + Octubre + Noviembre

  function getFeeValue(feeId: number): number {
    return feeDefinitions[feeId - 1].value;
  }

  // Build map: repId → { studentId, feeIds[] }
  // Use ALL student-rep pairs (including non-primary for siblings)
  const repPaymentMap = new Map<number, { studentId: number; feeIds: number[] }[]>();

  for (const pair of studentRepPairs) {
    const repId = pair.representativeId;
    if (!repPaymentMap.has(repId)) {
      repPaymentMap.set(repId, []);
    }
    repPaymentMap.get(repId)!.push({ studentId: pair.studentId, feeIds: PAYMENT_FEE_IDS });
  }

  // Get rep person info
  function getRepInfo(repId: number): { name: string; id: string; phone: string } {
    const rep = representatives.find(r => r.id === repId);
    if (!rep) return { name: 'Representante', id: 'V-00000000', phone: '0412-0000000' };
    const user = repUserMap.get(rep.userId);
    const person = user ? repPersonMap.get(user.personId) : undefined;
    return {
      name: person ? `${person.firstNames} ${person.lastNames}` : 'Representante',
      id: person ? person.identificationNumber : 'V-00000000',
      phone: user?.phone || '0412-0000000',
    };
  }

  // Map fee ID → fee name for descriptions
  const feeNames: Record<number, string> = {
    1: 'Inscripción',
    2: 'Septiembre', 3: 'Octubre', 4: 'Noviembre', 5: 'Diciembre',
    6: 'Enero', 7: 'Febrero', 8: 'Marzo', 9: 'Abril', 10: 'Mayo',
    11: 'Junio', 12: 'Julio', 13: 'Agosto',
  };

  // Generate payment dates based on fee
  function getPaymentDate(feeId: number): Date {
    if (feeId === FEE_INSCRIPCION) {
      // Inscripcion paid between Jul and Oct 2026
      return new Date(2026, randInt(6, 9), randInt(1, 28));
    }
    // Monthly fees: paid in the month or slightly after
    const monthIdx = feeId - 2; // 0 = Sep, 1 = Oct, ...
    const payMonth = Math.min(monthIdx + randInt(0, 2), 11); // pay within 0-2 months after start
    const baseYear = 2026 + Math.floor((monthIdx + payMonth) / 12);
    const baseMonth = (monthIdx + payMonth) % 12;
    return new Date(baseYear, baseMonth, randInt(1, 28));
  }

  // Determine currency and exchange based on payment method
  function getCurrencyAndExchange(pmId: number): { currency: $Enums.Currency; exchangeId: number | null } {
    if (pmId === 3) { // Zelle → always USD
      return { currency: $Enums.Currency.USD, exchangeId: null };
    }
    if (pmId === 1 || pmId === 4) { // Pago móvil or Efectivo → always VES
      return { currency: $Enums.Currency.VES, exchangeId: 1 };
    }
    // Transferencia → 50/50
    if (Math.random() < 0.5) {
      return { currency: $Enums.Currency.USD, exchangeId: null };
    }
    return { currency: $Enums.Currency.VES, exchangeId: 1 };
  }

  // Generate a description for the payment
  function getPaymentDescription(feeId: number): string {
    return `Pago de ${feeNames[feeId] || 'Arancel'}`;
  }

  // Create bundled payments
  let paymentId = 0;
  const paymentsData: any[] = [];
  const studentFeesData: any[] = [];

  for (const [repId, studentFees] of repPaymentMap) {
    if (studentFees.length === 0) continue;

    const repInfo = getRepInfo(repId);

    // Collect all unique fee IDs needed across this rep's students
    const feeToStudents = new Map<number, number[]>();
    for (const sf of studentFees) {
      for (const feeId of sf.feeIds) {
        if (!feeToStudents.has(feeId)) {
          feeToStudents.set(feeId, []);
        }
        feeToStudents.get(feeId)!.push(sf.studentId);
      }
    }

    // For each fee, create ONE payment covering all students
    for (const [feeId, studentIds] of feeToStudents) {
      const feeValue = getFeeValue(feeId);
      const pmId = pick([1, 2, 2, 3, 4]); // weighted: transferencia more common
      const { currency, exchangeId } = getCurrencyAndExchange(pmId);

      const totalUSD = feeValue * studentIds.length;
      const totalAmount = currency === $Enums.Currency.USD
        ? Math.round(totalUSD * 100) / 100
        : Math.round(totalUSD * EXCHANGE_RATE * 100) / 100;

      paymentId++;
      paymentsData.push({
        id: paymentId,
        paymentMethodId: pmId,
        exchangeId,
        totalAmount,
        currency,
        paymentDate: getPaymentDate(feeId),
        reference: `REF-${String(paymentId).padStart(4, '0')}`,
        payerName: repInfo.name,
        payerIdentification: repInfo.id,
        payerPhone: repInfo.phone,
        status: true,
        description: getPaymentDescription(feeId),
      });

      for (const studentId of studentIds) {
        studentFeesData.push({
          studentId,
          feeId,
          paymentId,
          status: true,
        });
      }
    }
  }

  await prisma.payment.createMany({ data: paymentsData });
  console.log(`Pagos creados (${paymentsData.length} payments, ${studentFeesData.length} student-fee records).`);

  // Batch insert student fees in chunks to handle large datasets
  const CHUNK_SIZE = 10000;
  for (let i = 0; i < studentFeesData.length; i += CHUNK_SIZE) {
    const chunk = studentFeesData.slice(i, i + CHUNK_SIZE);
    await prisma.studentFee.createMany({ data: chunk });
  }
  console.log('Aranceles por estudiante creados.');

  // ── 21. SCHOOL ──
  await prisma.school.create({
    data: {
      id: 1,
      schoolName: 'Francisco de Paula Salazar Acosta',
      schoolState: 'Zulia',
      schoolCity: 'Maracaibo',
    },
  });
  console.log('Escuela creada.');

  // ── 22. SCHOOL STUDENT HISTORY ──
  // Per-subject history for each student (all years prior to their current level)
  // Records are created at the same school (schoolId 1) with specific levelSubjectId
  const historyEnrollments = await prisma.studentEnrollment.findMany({
    where: { status: true },
    include: { section: { include: { highSchoolLevel: true } } },
  });
  const historyData: { studentId: number; levelSubjectId: number; schoolId: number; finalScore: number }[] = [];

  for (const enrollment of historyEnrollments) {
    const currentLevelId = enrollment.section.highSchoolLevelId;
    // Students in 1er Año (levelId=1) have no history
    if (currentLevelId < 2) continue;

    // For each year prior to current level
    for (let year = 1; year < currentLevelId; year++) {
      // Get all LevelSubjects for this year
      const yearSubjects = allLevelSubjects.filter(ls => ls.highSchoolLevelId === year);
      for (const ls of yearSubjects) {
        historyData.push({
          studentId: enrollment.studentId,
          levelSubjectId: ls.id,
          schoolId: 1,
          finalScore: randInt(14, 19),
        });
      }
    }
  }

  if (historyData.length > 0) {
    await prisma.schoolStudentHistory.createMany({ data: historyData });
    console.log(`Historial escolar creado (${historyData.length} registros).`);
  }

  // ── Sincronizar secuencias auto-increment ──
  const sequences = [
    'Role_id_seq', 'Person_id_seq', 'User_id_seq', 'UserRole_id_seq',
    'Student_id_seq', 'Representative_id_seq', 'Employee_id_seq',
    'StudentRepresentative_id_seq', 'HighSchoolLevel_id_seq',
    'SchoolYear_id_seq', 'Period_id_seq', 'Section_id_seq',
    'StudentEnrollment_id_seq',
    'LevelSubject_id_seq', 'TeachingGroup_id_seq', 'StudentTeachingGroup_id_seq', 'EvaluationType_id_seq', 'Evaluation_id_seq', 'GradeRecord_id_seq', 'Fee_id_seq', 'StudentFee_id_seq', 'PaymentType_id_seq', 'PaymentMethod_id_seq', 'Exchange_id_seq',
    'Payment_id_seq', 'School_id_seq', 'SchoolStudentHistory_id_seq',
  ];
  for (const seq of sequences) {
    const table = seq.replace('_id_seq', '');
    await prisma.$executeRawUnsafe(
      `SELECT setval('"${seq}"', COALESCE((SELECT MAX(id) FROM "${table}"), 1))`
    );
  }
  console.log('Secuencias sincronizadas.');

  console.log('✅ Seed completado exitosamente.');

  // Print summary
  console.log('\n📊 Resumen:');
  console.log(`  Estudiantes: ${TOTAL_STUDENTS} (todos activos)`);
  console.log(`  Representantes: ${REP_COUNT}`);
  console.log(`  Pagos realizados: ${paymentsData.length}`);
  console.log(`  StudentFee records: ${studentFeesData.length}`);
  console.log(`  Usuarios staff (sin docentes): ${staffUserData.length}`);
  console.log(`  Escuelas: 1`);
  console.log(`  Historial escolar: ${historyData.length} registros`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
