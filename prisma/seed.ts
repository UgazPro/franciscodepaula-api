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
    'PayrollAdjustment', 'PayrollRecord', 'EmployeeWorkHour', 'PayrollPeriod',
    'Payment', 'Exchange', 'PaymentMethod', 'Fee',
    'ReportCard', 'GradeRecord', 'Evaluation', 'StudentTeachingGroup', 'TeachingGroup', 'LevelSubject', 'Subject',
    'StudentEnrollment', 'Section', 'Period', 'SchoolYear',
    'HighSchoolLevel', 'StudentRepresentative', 'Employee', 'Representative',
    'Student', 'User', 'Person', 'Role',
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
    { id: 6, firstNames: 'Ana', lastNames: 'García Castillo', identificationNumber: 'V-66778899', birthDate: new Date('1991-02-14'), gender: 'Femenino' },
    { id: 7, firstNames: 'Diana', lastNames: 'Pereira', identificationNumber: 'V-11122233', birthDate: new Date('1987-08-22'), gender: 'Femenino' },
    // New docentes (8-19)
    { id: 8, firstNames: pick(maleNames), lastNames: `${pick(lastNames)} ${pick(lastNames)}`, identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 9, firstNames: pick(femaleNames), lastNames: `${pick(lastNames)} ${pick(lastNames)}`, identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Femenino' },
    { id: 10, firstNames: pick(maleNames), lastNames: `${pick(lastNames)} ${pick(lastNames)}`, identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 11, firstNames: pick(femaleNames), lastNames: `${pick(lastNames)} ${pick(lastNames)}`, identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Femenino' },
    { id: 12, firstNames: pick(maleNames), lastNames: `${pick(lastNames)} ${pick(lastNames)}`, identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 13, firstNames: pick(femaleNames), lastNames: `${pick(lastNames)} ${pick(lastNames)}`, identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Femenino' },
    { id: 14, firstNames: pick(maleNames), lastNames: `${pick(lastNames)} ${pick(lastNames)}`, identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 15, firstNames: pick(femaleNames), lastNames: `${pick(lastNames)} ${pick(lastNames)}`, identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Femenino' },
    { id: 16, firstNames: pick(maleNames), lastNames: `${pick(lastNames)} ${pick(lastNames)}`, identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 17, firstNames: pick(femaleNames), lastNames: `${pick(lastNames)} ${pick(lastNames)}`, identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Femenino' },
    { id: 18, firstNames: pick(maleNames), lastNames: `${pick(lastNames)} ${pick(lastNames)}`, identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Masculino' },
    { id: 19, firstNames: pick(femaleNames), lastNames: `${pick(lastNames)} ${pick(lastNames)}`, identificationNumber: generateCI(), birthDate: new Date(randInt(1980, 1995), randInt(0, 11), randInt(1, 28)), gender: 'Femenino' },
  ];

  // Student persons (20-269)
  const STUDENT_PERSON_START = 20;
  const TOTAL_STUDENTS = 250;

  const studentPersons: { id: number; firstNames: string; lastNames: string; identificationNumber: string; birthDate: Date; gender: string }[] = [];
  for (let i = 0; i < TOTAL_STUDENTS; i++) {
    const isMale = Math.random() < 0.5;
    const firstNames = isMale ? pick(maleNames) : pick(femaleNames);
    const lastNamesStr = `${pick(lastNames)} ${pick(lastNames)}`;
    const year = randInt(2008, 2014);
    const month = randInt(1, 12);
    const day = randInt(1, 28);
    studentPersons.push({
      id: STUDENT_PERSON_START + i,
      firstNames,
      lastNames: lastNamesStr,
      identificationNumber: generateCI(),
      birthDate: new Date(year, month - 1, day),
      gender: isMale ? 'Masculino' : 'Femenino',
    });
  }

  // Representative persons (270-399)
  const REP_COUNT = 130;
  const REP_PERSON_START = STUDENT_PERSON_START + TOTAL_STUDENTS; // 270

  const repPersons: { id: number; firstNames: string; lastNames: string; identificationNumber: string; birthDate: Date; gender: string }[] = [];
  for (let i = 0; i < REP_COUNT; i++) {
    const isMale = Math.random() < 0.45;
    const firstNames = isMale ? pick(maleNames) : pick(femaleNames);
    const lastNamesStr = `${pick(lastNames)} ${pick(lastNames)}`;
    repPersons.push({
      id: REP_PERSON_START + i,
      firstNames,
      lastNames: lastNamesStr,
      identificationNumber: generateCI(),
      birthDate: new Date(randInt(1970, 1995), randInt(0, 11), randInt(1, 28)),
      gender: isMale ? 'Masculino' : 'Femenino',
    });
  }

  await prisma.person.createMany({ data: [...staffPersons, ...studentPersons, ...repPersons] });
  console.log('Personas creadas.');

  // ── 4. USERS ──
  const staffUserData = [
    // Existing staff
    { id: 1, personId: 1, roleId: 1, email: 'admin@admin.com', password: adminPassword, phone: '0412-1111111', status: true },
    { id: 2, personId: 2, roleId: 2, email: 'directora@colegio.com', password, phone: '0412-2222222', status: true },
    { id: 3, personId: 3, roleId: 3, email: 'subdirector@colegio.com', password, phone: '0412-3333333', status: true },
    { id: 4, personId: 4, roleId: 4, email: 'contador@colegio.com', password, phone: '0412-4444444', status: true },
    { id: 5, personId: 5, roleId: 5, email: 'control@colegio.com', password, phone: '0412-5555555', status: true },
    { id: 6, personId: 6, roleId: 6, email: 'ana.garcia@colegio.com', password, phone: '0412-6666666', status: true },
    { id: 7, personId: 7, roleId: 1, email: 'diana@pereira.com', password: adminPassword, phone: '0412-7777777', status: true },
    // New docentes (8-19)
    { id: 8, personId: 8, roleId: 6, email: 'docente8@colegio.com', password, phone: '0412-8888888', status: true },
    { id: 9, personId: 9, roleId: 6, email: 'docente9@colegio.com', password, phone: '0412-9999999', status: true },
    { id: 10, personId: 10, roleId: 6, email: 'docente10@colegio.com', password, phone: '0412-1010101', status: true },
    { id: 11, personId: 11, roleId: 6, email: 'docente11@colegio.com', password, phone: '0412-1111110', status: true },
    { id: 12, personId: 12, roleId: 6, email: 'docente12@colegio.com', password, phone: '0412-1212121', status: true },
    { id: 13, personId: 13, roleId: 6, email: 'docente13@colegio.com', password, phone: '0412-1313131', status: true },
    { id: 14, personId: 14, roleId: 6, email: 'docente14@colegio.com', password, phone: '0412-1414141', status: true },
    { id: 15, personId: 15, roleId: 6, email: 'docente15@colegio.com', password, phone: '0412-1515151', status: true },
    { id: 16, personId: 16, roleId: 6, email: 'docente16@colegio.com', password, phone: '0412-1616161', status: true },
    { id: 17, personId: 17, roleId: 6, email: 'docente17@colegio.com', password, phone: '0412-1717171', status: true },
    { id: 18, personId: 18, roleId: 6, email: 'docente18@colegio.com', password, phone: '0412-1818181', status: true },
    { id: 19, personId: 19, roleId: 6, email: 'docente19@colegio.com', password, phone: '0412-1919191', status: true },
  ];
  await prisma.user.createMany({ data: staffUserData });

  const repUsersData = repPersons.map((p, i) => ({
    id: 20 + i,
    personId: p.id,
    roleId: 7,
    email: `representante${i + 1}@correo.com`,
    password,
    phone: `0412-${String(1000000 + i).slice(1)}`,
    status: true,
  }));
  await prisma.user.createMany({ data: repUsersData });
  console.log('Usuarios creados.');

  // ── 5. STUDENTS ──
  const STUDENT_ACTIVE = 200;
  const STUDENT_INACTIVE = 50;

  const shuffledStudentIds = shuffle(studentPersons.map(p => p.id));
  const activeIds = shuffledStudentIds.slice(0, STUDENT_ACTIVE);
  const inactiveIds = shuffledStudentIds.slice(STUDENT_ACTIVE);

  const addressOptions = ['Calle 5 de Julio', 'Av. 15 con Calle 10', 'Urb. Las Delicias', 'Sector El Milagro', 'Barrio San José', 'Av. La Limpia', 'Calle 77', 'Urb. Veritas', 'Sector 3 de Mayo', 'Parroquia Olegario Villalobos'];

  // Student groups within active:
  // First 155 enrolled (paying), next 45 pending (no payments)
  const ENROLLED_COUNT = 155;
  const PENDING_COUNT = 45;

  const enrolledIds = activeIds.slice(0, ENROLLED_COUNT);
  const pendingIds = activeIds.slice(ENROLLED_COUNT, ENROLLED_COUNT + PENDING_COUNT);

  function randomLocation() {
    const muni = pick(municipalities_names);
    const parishOpts = parish_names_map[muni] || ['Bolívar'];
    return { municipality: muni, parish: pick(parishOpts) };
  }

  const schoolsList = ['U.E. Colegio Francisco de Paula', 'U.E. Andrés Bello', 'U.E. San José', 'U.E. Rafael Urdaneta', 'U.E. Cecilio Acosta', 'U.E. Santa María', 'U.E. Don Bosco', 'U.E. Simón Bolívar'];

  const studentsData = [
    ...enrolledIds.map(id => {
      const loc = randomLocation();
      return {
        personId: id,
        birthCountry: Math.random() < 0.92 ? 'Venezuela' : 'Colombia',
        state: 'Zulia',
        municipality: loc.municipality,
        parish: loc.parish,
        currentParish: loc.parish,
        previousSchool: pick(schoolsList),
        address: `${pick(addressOptions)} #${randInt(1, 200)}`,
        status: true,
        admissionDate: new Date('2025-07-01'),
      };
    }),
    ...pendingIds.map(id => {
      const loc = randomLocation();
      return {
        personId: id,
        birthCountry: 'Venezuela',
        state: 'Zulia',
        municipality: loc.municipality,
        parish: loc.parish,
        currentParish: loc.parish,
        previousSchool: pick(schoolsList),
        address: `${pick(addressOptions)} #${randInt(1, 200)}`,
        status: true,
        admissionDate: new Date('2025-07-01'),
      };
    }),
    ...inactiveIds.map(id => ({
      personId: id,
      birthCountry: 'Venezuela',
      state: 'Zulia',
      municipality: pick(municipalities_names),
      parish: 'Bolívar',
      currentParish: 'Bolívar',
      previousSchool: 'U.E. Anterior',
      address: 'Dirección de muestra',
      status: false,
      admissionDate: new Date('2024-09-01'),
    })),
  ];
  await prisma.student.createMany({ data: studentsData });
  console.log('Estudiantes creados.');

  const allStudents = await prisma.student.findMany({ orderBy: { id: 'asc' } });
  const activeStudents = allStudents.filter(s => s.status);

  // ── 6. REPRESENTATIVES ──
  const repUsers = await prisma.user.findMany({ where: { roleId: 7 }, orderBy: { id: 'asc' } });
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
  // Distribution: 50 reps × 1 student, 40 reps × 2 students, 40 reps × 3 students = 250
  const repsWith1 = 50;
  const repsWith2 = 40;
  const repsWith3 = 40;

  const studentRepPairs: { studentId: number; representativeId: number; relationship: string; isPrimary: boolean }[] = [];
  const repStream = shuffle([...representatives]);
  const studentStream = shuffle([...allStudents]);

  let si = 0; // student index in shuffled stream
  for (let ri = 0; ri < repStream.length; ri++) {
    let count: number;
    if (ri < repsWith3) {
      count = 3;
    } else if (ri < repsWith3 + repsWith2) {
      count = 2;
    } else {
      count = 1;
    }

    for (let c = 0; c < count && si < studentStream.length; c++) {
      studentRepPairs.push({
        studentId: studentStream[si].id,
        representativeId: repStream[ri].id,
        relationship: pick(representativeRelations),
        isPrimary: c === 0,
      });
      si++;
    }
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
      // Existing employees
      { userId: 2, baseHourRate: 0, hireDate: new Date('2020-01-15') },
      { userId: 3, baseHourRate: 0, hireDate: new Date('2021-03-01') },
      { userId: 4, baseHourRate: 0, hireDate: new Date('2022-06-01') },
      { userId: 5, baseHourRate: 0, hireDate: new Date('2023-09-01') },
      { userId: 6, baseHourRate: 12.5, hireDate: new Date('2020-09-01') },
      // New docentes employees (8-19)
      { userId: 8, baseHourRate: 12.5, hireDate: new Date('2021-09-01') },
      { userId: 9, baseHourRate: 12.5, hireDate: new Date('2022-09-01') },
      { userId: 10, baseHourRate: 12.5, hireDate: new Date('2023-09-01') },
      { userId: 11, baseHourRate: 12.5, hireDate: new Date('2021-09-01') },
      { userId: 12, baseHourRate: 12.5, hireDate: new Date('2022-09-01') },
      { userId: 13, baseHourRate: 12.5, hireDate: new Date('2023-09-01') },
      { userId: 14, baseHourRate: 12.5, hireDate: new Date('2021-09-01') },
      { userId: 15, baseHourRate: 12.5, hireDate: new Date('2022-09-01') },
      { userId: 16, baseHourRate: 12.5, hireDate: new Date('2023-09-01') },
      { userId: 17, baseHourRate: 12.5, hireDate: new Date('2021-09-01') },
      { userId: 18, baseHourRate: 12.5, hireDate: new Date('2022-09-01') },
      { userId: 19, baseHourRate: 12.5, hireDate: new Date('2023-09-01') },
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
    { id: 1, subject: 'Matemática', code: 'MAT', status: true },
    { id: 2, subject: 'Lengua y Literatura', code: 'LYL', status: true },
    { id: 3, subject: 'Ciencias Naturales', code: 'CN', status: true },
    { id: 4, subject: 'Historia Universal', code: 'HU', status: true },
    { id: 5, subject: 'Geografía', code: 'GEO', status: true },
    { id: 6, subject: 'Inglés', code: 'ING', status: true },
    { id: 7, subject: 'Educación Física', code: 'EF', status: true },
    { id: 8, subject: 'Arte y Cultura', code: 'AC', status: true },
    { id: 9, subject: 'Formación Ciudadana', code: 'FC', status: true },
    { id: 10, subject: 'Química', code: 'QUI', status: true },
    { id: 11, subject: 'Física', code: 'FIS', status: true },
    { id: 12, subject: 'Biología', code: 'BIO', status: true },
    { id: 13, subject: 'CRP', code: 'CRP', status: true },
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
    { highSchoolLevelId: 1, subjectId: 7 },
    { highSchoolLevelId: 1, subjectId: 8 },
    { highSchoolLevelId: 1, subjectId: 9 },
    // 2do Año
    { highSchoolLevelId: 2, subjectId: 1 },
    { highSchoolLevelId: 2, subjectId: 2 },
    { highSchoolLevelId: 2, subjectId: 3 },
    { highSchoolLevelId: 2, subjectId: 4 },
    { highSchoolLevelId: 2, subjectId: 6 },
    { highSchoolLevelId: 2, subjectId: 7 },
    { highSchoolLevelId: 2, subjectId: 8 },
    { highSchoolLevelId: 2, subjectId: 9 },
    // 3er Año
    { highSchoolLevelId: 3, subjectId: 1 },
    { highSchoolLevelId: 3, subjectId: 2 },
    { highSchoolLevelId: 3, subjectId: 3 },
    { highSchoolLevelId: 3, subjectId: 4 },
    { highSchoolLevelId: 3, subjectId: 6 },
    { highSchoolLevelId: 3, subjectId: 7 },
    { highSchoolLevelId: 3, subjectId: 10 },
    { highSchoolLevelId: 3, subjectId: 12 },
    // 4to Año
    { highSchoolLevelId: 4, subjectId: 1 },
    { highSchoolLevelId: 4, subjectId: 2 },
    { highSchoolLevelId: 4, subjectId: 4 },
    { highSchoolLevelId: 4, subjectId: 6 },
    { highSchoolLevelId: 4, subjectId: 10 },
    { highSchoolLevelId: 4, subjectId: 11 },
    { highSchoolLevelId: 4, subjectId: 12 },
    // 5to Año
    { highSchoolLevelId: 5, subjectId: 1 },
    { highSchoolLevelId: 5, subjectId: 2 },
    { highSchoolLevelId: 5, subjectId: 4 },
    { highSchoolLevelId: 5, subjectId: 6 },
    { highSchoolLevelId: 5, subjectId: 10 },
    { highSchoolLevelId: 5, subjectId: 11 },
    { highSchoolLevelId: 5, subjectId: 12 },
    // CRP en todos los niveles
    { highSchoolLevelId: 1, subjectId: 13 },
    { highSchoolLevelId: 2, subjectId: 13 },
    { highSchoolLevelId: 3, subjectId: 13 },
    { highSchoolLevelId: 4, subjectId: 13 },
    { highSchoolLevelId: 5, subjectId: 13 },
  ];
  await prisma.levelSubject.createMany({ data: levelSubjectsData });
  console.log('Materias por nivel creadas.');

  // ── 12. SCHOOL YEAR ──
  await prisma.schoolYear.createMany({
    data: [
      { id: 1, name: '2025-2026', startDate: new Date('2025-07-01'), endDate: new Date('2026-06-30'), isActive: true },
    ],
  });
  console.log('Año escolar creado.');

  // ── 13. PERIODS ──
  await prisma.period.createMany({
    data: [
      { id: 1, schoolYearId: 1, period: '1er Lapso', startDate: new Date('2025-09-15'), endDate: new Date('2025-12-19') },
      { id: 2, schoolYearId: 1, period: '2do Lapso', startDate: new Date('2026-01-12'), endDate: new Date('2026-04-10') },
      { id: 3, schoolYearId: 1, period: '3er Lapso', startDate: new Date('2026-04-13'), endDate: new Date('2026-06-30') },
    ],
  });
  console.log('Períodos creados.');

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
  const studentsWithEnrollment = allStudents.filter(s => s.status); // 200

  const enrollmentsData: { studentId: number; schoolYearId: number; sectionId: number; enrollmentDate: Date; status: boolean }[] = [];

  for (let i = 0; i < studentsWithEnrollment.length; i++) {
    const sectionIdx = i % sections.length;
    const section = sections[sectionIdx];
    const isEnrolled = i < ENROLLED_COUNT; // first 155 have enrollment.status=true

    enrollmentsData.push({
      studentId: studentsWithEnrollment[i].id,
      schoolYearId: 1,
      sectionId: section.id,
      enrollmentDate: new Date('2025-09-15'),
      status: isEnrolled,
    });
  }

  await prisma.studentEnrollment.createMany({ data: enrollmentsData });
  console.log('Matrículas oficiales creadas.');

  // ── 16. TEACHING GROUPS ──
  const allLevelSubjects = await prisma.levelSubject.findMany();
  const allSections = await prisma.section.findMany();
  const allSchoolYears = await prisma.schoolYear.findMany();
  
  // Get all docente employees (users 6, 8-19)
  const docenteUserIds = [6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const docenteEmployees = await prisma.employee.findMany({
    where: { userId: { in: docenteUserIds } },
  });

  if (docenteEmployees.length > 0) {
    const assignmentData = allSections.flatMap((section) =>
      allLevelSubjects
        .filter((ls) => ls.highSchoolLevelId === section.highSchoolLevelId)
        .map((ls, index) => ({
          teacherId: docenteEmployees[index % docenteEmployees.length].id,
          levelSubjectId: ls.id,
          schoolYearId: section.schoolYearId,
          sectionId: section.id,
          assignedAt: new Date('2025-09-01'),
          status: true,
        })),
    );
    await prisma.teachingGroup.createMany({ data: assignmentData });
    console.log(`Grupos docentes creados (${assignmentData.length}).`);
  } else {
    console.log('⚠️ No se encontraron empleados docentes para asignar materias.');
  }

  // ── 16b. CRP TEACHING GROUPS ──
  const crpNames = ['Karate', 'Pintura', 'Bordado', 'Ajedrez', 'Música', 'Danza'];
  const crpLevelSubjects = await prisma.levelSubject.findMany({
    where: { subject: { code: 'CRP' } },
  });
  
  // Get CRP docente employees (users 8-13, one per CRP)
  const crpDocenteUserIds = [8, 9, 10, 11, 12, 13];
  const crpDocenteEmployees = await prisma.employee.findMany({
    where: { userId: { in: crpDocenteUserIds } },
  });

  if (crpLevelSubjects.length > 0 && crpDocenteEmployees.length >= 6) {
    // Create CRP TeachingGroups for each CRP × each level
    const crpData = crpNames.flatMap((name, crpIndex) =>
      crpLevelSubjects.map((ls) => ({
        teacherId: crpDocenteEmployees[crpIndex].id,
        levelSubjectId: ls.id,
        schoolYearId: 1,
        sectionId: null as number | null,
        groupName: name,
        isSpecialGroup: true,
        assignedAt: new Date('2025-09-01'),
        status: true,
      })),
    );
    await prisma.teachingGroup.createMany({ data: crpData });
    console.log(`Grupos CRP creados (${crpData.length}).`);
  } else {
    console.log('⚠️ No se encontraron suficientes empleados para asignar CRPs.');
  }

  // ── 16c. STUDENT TEACHING GROUPS (CRPs) ──
  // Add students from different levels to CRPs
  const crpTeachingGroups = await prisma.teachingGroup.findMany({
    where: { isSpecialGroup: true },
    include: { levelSubject: { include: { highSchoolLevel: true } } },
  });
  const allEnrollments = await prisma.studentEnrollment.findMany({
    where: { status: true },
    include: { section: { include: { highSchoolLevel: true } } },
  });

  const studentGroupData: { studentEnrollmentId: number; teachingGroupId: number }[] = [];

  for (const crpGroup of crpTeachingGroups) {
    // Get the level of this CRP
    const levelId = crpGroup.levelSubject.highSchoolLevelId;
    
    // Filter enrollments from this level
    const levelEnrollments = allEnrollments.filter(
      (e) => e.section.highSchoolLevelId === levelId
    );
    
    // Select 5-10 random students from this level
    const studentCount = Math.min(randInt(5, 10), levelEnrollments.length);
    const selectedEnrollments = pickN(levelEnrollments, studentCount);
    
    for (const enrollment of selectedEnrollments) {
      studentGroupData.push({
        studentEnrollmentId: enrollment.id,
        teachingGroupId: crpGroup.id,
      });
    }
  }

  if (studentGroupData.length > 0) {
    await prisma.studentTeachingGroup.createMany({ data: studentGroupData });
    console.log(`Estudiantes asignados a CRPs (${studentGroupData.length} registros).`);
  }

  // ── 17. FEES ──
  // Fee 1: Inscripción $60 (01/07/2025 - 30/06/2026)
  // Fees 2-13: Monthly $90 each (Sep 2025 - Aug 2026)
  const feeDefinitions = [
    { name: 'Inscripción', value: 60, startAt: new Date('2025-07-01'), endAt: new Date('2026-06-30') },
    { name: 'Septiembre', value: 90, startAt: new Date('2025-09-01'), endAt: new Date('2025-09-30') },
    { name: 'Octubre', value: 90, startAt: new Date('2025-10-01'), endAt: new Date('2025-10-31') },
    { name: 'Noviembre', value: 90, startAt: new Date('2025-11-01'), endAt: new Date('2025-11-30') },
    { name: 'Diciembre', value: 90, startAt: new Date('2025-12-01'), endAt: new Date('2025-12-31') },
    { name: 'Enero', value: 90, startAt: new Date('2026-01-01'), endAt: new Date('2026-01-31') },
    { name: 'Febrero', value: 90, startAt: new Date('2026-02-01'), endAt: new Date('2026-02-28') },
    { name: 'Marzo', value: 90, startAt: new Date('2026-03-01'), endAt: new Date('2026-03-31') },
    { name: 'Abril', value: 90, startAt: new Date('2026-04-01'), endAt: new Date('2026-04-30') },
    { name: 'Mayo', value: 90, startAt: new Date('2026-05-01'), endAt: new Date('2026-05-31') },
    { name: 'Junio', value: 90, startAt: new Date('2026-06-01'), endAt: new Date('2026-06-30') },
    { name: 'Julio', value: 90, startAt: new Date('2026-07-01'), endAt: new Date('2026-07-31') },
    { name: 'Agosto', value: 90, startAt: new Date('2026-08-01'), endAt: new Date('2026-08-31') },
  ];

  const feesData = feeDefinitions.map((f, i) => ({
    id: i + 1,
    name: f.name,
    schoolYearId: 1,
    value: f.value,
    createdAt: new Date('2025-07-01'),
    startAt: f.startAt,
    endAt: f.endAt,
  }));
  await prisma.fee.createMany({ data: feesData });
  console.log('Aranceles creados.');

  const FEE_INSCRIPCION = 1;
  const MONTHLY_FEE_IDS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

  // ── 18. PAYMENT METHODS ──
  await prisma.paymentMethod.createMany({
    data: [
      { id: 1, type: 'Pago móvil', active: true },
      { id: 2, type: 'Transferencia', active: true },
      { id: 3, type: 'Zelle', active: true },
      { id: 4, type: 'Efectivo', active: true },
    ],
  });
  console.log('Métodos de pago creados.');

  // ── 19. EXCHANGE ──
  const EXCHANGE_RATE = 602.3324;
  await prisma.exchange.createMany({
    data: [
      { id: 1, rate: EXCHANGE_RATE, date: new Date() },
    ],
  });
  console.log('Tasa de cambio creada.');

  // ── 20. PAYMENTS + STUDENT FEES (BUNDLED) ──
  // Determine which payment group each enrolled student belongs to
  const FULLY_PAID = 50;
  const MOSTLY_PAID = 40;
  const PARTIAL = 35;
  // Inscripcion only: 155 - 50 - 40 - 35 = 30

  const sortedEnrolled = allStudents.slice(0, ENROLLED_COUNT); // first 155 students

  const studentGroup = new Map<number, string>();
  for (let i = 0; i < sortedEnrolled.length; i++) {
    if (i < FULLY_PAID) {
      studentGroup.set(sortedEnrolled[i].id, 'fully_paid');
    } else if (i < FULLY_PAID + MOSTLY_PAID) {
      studentGroup.set(sortedEnrolled[i].id, 'mostly_paid');
    } else if (i < FULLY_PAID + MOSTLY_PAID + PARTIAL) {
      studentGroup.set(sortedEnrolled[i].id, 'partial');
    } else {
      studentGroup.set(sortedEnrolled[i].id, 'inscripcion_only');
    }
  }

  // Determine which fees each student needs
  function getStudentFeeIds(studentId: number): number[] {
    const group = studentGroup.get(studentId);
    if (!group) return [];

    switch (group) {
      case 'fully_paid':
        return [FEE_INSCRIPCION, ...MONTHLY_FEE_IDS];
      case 'mostly_paid':
        return [FEE_INSCRIPCION, ...pickN(MONTHLY_FEE_IDS, randInt(8, 11))];
      case 'partial':
        return [FEE_INSCRIPCION, ...pickN(MONTHLY_FEE_IDS, randInt(3, 7))];
      case 'inscripcion_only':
        return [FEE_INSCRIPCION];
      default:
        return [];
    }
  }

  // Get fee value by ID
  function getFeeValue(feeId: number): number {
    return feeDefinitions[feeId - 1].value;
  }

  // Build map: repId → { studentId, feeIds[] }
  const repPaymentMap = new Map<number, { studentId: number; feeIds: number[] }[]>();

  for (const [studentId, repId] of studentPrimaryRepMap) {
    const feeIds = getStudentFeeIds(studentId);
    if (feeIds.length === 0) continue;

    if (!repPaymentMap.has(repId)) {
      repPaymentMap.set(repId, []);
    }
    repPaymentMap.get(repId)!.push({ studentId, feeIds });
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
      // Inscripcion paid between Jul and Oct 2025
      return new Date(2025, randInt(6, 9), randInt(1, 28));
    }
    // Monthly fees: paid in the month or slightly after
    const monthIdx = feeId - 2; // 0 = Sep, 1 = Oct, ...
    const payMonth = Math.min(monthIdx + randInt(0, 2), 11); // pay within 0-2 months after start
    const baseYear = 2025 + Math.floor((monthIdx + payMonth) / 12);
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

  // ── Sincronizar secuencias auto-increment ──
  const sequences = [
    'Role_id_seq', 'Person_id_seq', 'User_id_seq',
    'Student_id_seq', 'Representative_id_seq', 'Employee_id_seq',
    'StudentRepresentative_id_seq', 'HighSchoolLevel_id_seq',
    'SchoolYear_id_seq', 'Period_id_seq', 'Section_id_seq',
    'StudentEnrollment_id_seq',
    'LevelSubject_id_seq', 'Fee_id_seq', 'StudentFee_id_seq', 'PaymentMethod_id_seq', 'Exchange_id_seq',
    'Payment_id_seq',
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
  console.log(`  Estudiantes: ${TOTAL_STUDENTS} (${STUDENT_ACTIVE} activos, ${STUDENT_INACTIVE} inactivos)`);
  console.log(`  Representantes: ${REP_COUNT}`);
  console.log(`  Pagos realizados: ${paymentsData.length}`);
  console.log(`  StudentFee records: ${studentFeesData.length}`);
  console.log(`  Usuarios staff: ${staffUserData.length}`);
  const groupedPayments = paymentsData.filter(p => {
    const count = studentFeesData.filter(sf => sf.paymentId === p.id).length;
    return count >= 2;
  }).length;
  console.log(`  Pagos agrupados (≥2 estudiantes): ${groupedPayments} de ${paymentsData.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
