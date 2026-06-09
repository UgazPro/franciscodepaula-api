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

const maleLastNames = [
  'Pérez', 'García', 'Rodríguez', 'Martínez', 'Hernández', 'López', 'González', 'Rivas', 'Castillo', 'Contreras',
  'Torres', 'Medina', 'Silva', 'Jiménez', 'Díaz', 'Mendoza', 'Rojas', 'Acosta', 'Castro', 'Ortiz',
  'Molina', 'Álvarez', 'Peña', 'León', 'Navarro', 'Cruz', 'Reyes', 'Mejías', 'Quintero', 'Villalobos',
  'Machado', 'Rondón', 'Colina', 'Urdaneta', 'Briceño', 'Finol', 'Baez', 'Cárdenas', 'Arias', 'Morales',
  'Delgado', 'Tovar', 'Guedez', 'Parra', 'Suárez', 'Bravo', 'Figueroa', 'Salazar', 'Paredes', 'Ferrer',
];

const femaleLastNames = [
  'Pérez', 'García', 'Rodríguez', 'Martínez', 'Hernández', 'López', 'González', 'Rivas', 'Castillo', 'Contreras',
  'Torres', 'Medina', 'Silva', 'Jiménez', 'Díaz', 'Mendoza', 'Rojas', 'Acosta', 'Castro', 'Ortiz',
  'Molina', 'Álvarez', 'Peña', 'León', 'Navarro', 'Cruz', 'Reyes', 'Mejías', 'Quintero', 'Villalobos',
  'Machado', 'Rondón', 'Colina', 'Urdaneta', 'Briceño', 'Finol', 'Báez', 'Cárdenas', 'Arias', 'Morales',
  'Delgado', 'Tovar', 'Guedez', 'Parra', 'Suárez', 'Bravo', 'Figueroa', 'Salazar', 'Paredes', 'Ferrer',
];

const representativeRelations = ['Madre', 'Padre', 'Representante Legal', 'Tío', 'Tía', 'Abuelo', 'Abuela', 'Hermano', 'Hermana'];
const occupations = ['Abogado(a)', 'Ingeniero(a)', 'Médico(a)', 'Docente', 'Contador(a) Público(a)', 'Arquitecto(a)', 'Comerciante', 'Chofer', 'Enfermero(a)', 'Administrador(a)', 'Psicólogo(a)', 'Odontólogo(a)', 'Empresario(a)', 'Agricultor(a)', 'Ama de Casa'];

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
    'ReportCard', 'GradeRecord', 'Evaluation', 'TeacherSubjectSection', 'Subject',
    'StudentEnrollment', 'StudentSection', 'Section', 'Period', 'SchoolYear',
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

  // ── LOCATION (sin cambios) ──
  const countriesData = [
    { name: 'Afganistán' }, { name: 'Albania' }, { name: 'Alemania' },
    { name: 'Andorra' }, { name: 'Angola' }, { name: 'Antigua y Barbuda' },
    { name: 'Arabia Saudita' }, { name: 'Argelia' }, { name: 'Argentina' },
    { name: 'Armenia' }, { name: 'Australia' }, { name: 'Austria' },
    { name: 'Azerbaiyán' }, { name: 'Bahamas' }, { name: 'Bangladés' },
    { name: 'Barbados' }, { name: 'Baréin' }, { name: 'Bélgica' },
    { name: 'Belice' }, { name: 'Benín' }, { name: 'Bielorrusia' },
    { name: 'Birmania' }, { name: 'Bolivia' }, { name: 'Bosnia y Herzegovina' },
    { name: 'Botsuana' }, { name: 'Brasil' }, { name: 'Brunéi' },
    { name: 'Bulgaria' }, { name: 'Burkina Faso' }, { name: 'Burundi' },
    { name: 'Bután' }, { name: 'Cabo Verde' }, { name: 'Camboya' },
    { name: 'Camerún' }, { name: 'Canadá' }, { name: 'Catar' },
    { name: 'Chad' }, { name: 'Chile' }, { name: 'China' },
    { name: 'Chipre' }, { name: 'Colombia' }, { name: 'Comoras' },
    { name: 'Corea del Norte' }, { name: 'Corea del Sur' }, { name: 'Costa de Marfil' },
    { name: 'Costa Rica' }, { name: 'Croacia' }, { name: 'Cuba' },
    { name: 'Dinamarca' }, { name: 'Dominica' }, { name: 'Ecuador' },
    { name: 'Egipto' }, { name: 'El Salvador' }, { name: 'Emiratos Árabes Unidos' },
    { name: 'Eritrea' }, { name: 'Eslovaquia' }, { name: 'Eslovenia' },
    { name: 'España' }, { name: 'Estados Unidos' }, { name: 'Estonia' },
    { name: 'Esuatini' }, { name: 'Etiopía' }, { name: 'Filipinas' },
    { name: 'Finlandia' }, { name: 'Fiyi' }, { name: 'Francia' },
    { name: 'Gabón' }, { name: 'Gambia' }, { name: 'Georgia' },
    { name: 'Ghana' }, { name: 'Granada' }, { name: 'Grecia' },
    { name: 'Guatemala' }, { name: 'Guinea' }, { name: 'Guinea-Bisáu' },
    { name: 'Guinea Ecuatorial' }, { name: 'Guyana' }, { name: 'Haití' },
    { name: 'Honduras' }, { name: 'Hungría' }, { name: 'India' },
    { name: 'Indonesia' }, { name: 'Irak' }, { name: 'Irán' },
    { name: 'Irlanda' }, { name: 'Islandia' }, { name: 'Islas Marshall' },
    { name: 'Islas Salomón' }, { name: 'Israel' }, { name: 'Italia' },
    { name: 'Jamaica' }, { name: 'Japón' }, { name: 'Jordania' },
    { name: 'Kazajistán' }, { name: 'Kenia' }, { name: 'Kirguistán' },
    { name: 'Kiribati' }, { name: 'Kuwait' }, { name: 'Laos' },
    { name: 'Lesoto' }, { name: 'Letonia' }, { name: 'Líbano' },
    { name: 'Liberia' }, { name: 'Libia' }, { name: 'Liechtenstein' },
    { name: 'Lituania' }, { name: 'Luxemburgo' }, { name: 'Madagascar' },
    { name: 'Malasia' }, { name: 'Malaui' }, { name: 'Maldivas' },
    { name: 'Mali' }, { name: 'Malta' }, { name: 'Marruecos' },
    { name: 'Mauricio' }, { name: 'Mauritania' }, { name: 'México' },
    { name: 'Micronesia' }, { name: 'Moldavia' }, { name: 'Mónaco' },
    { name: 'Mongolia' }, { name: 'Montenegro' }, { name: 'Mozambique' },
    { name: 'Namibia' }, { name: 'Nauru' }, { name: 'Nepal' },
    { name: 'Nicaragua' }, { name: 'Níger' }, { name: 'Nigeria' },
    { name: 'Noruega' }, { name: 'Nueva Zelanda' }, { name: 'Omán' },
    { name: 'Países Bajos' }, { name: 'Pakistán' }, { name: 'Palaos' },
    { name: 'Palestina' }, { name: 'Panamá' }, { name: 'Papúa Nueva Guinea' },
    { name: 'Paraguay' }, { name: 'Perú' }, { name: 'Polonia' },
    { name: 'Portugal' }, { name: 'Reino Unido' }, { name: 'República Centroafricana' },
    { name: 'República Checa' }, { name: 'República del Congo' },
    { name: 'República Democrática del Congo' }, { name: 'República Dominicana' },
    { name: 'Ruanda' }, { name: 'Rumania' }, { name: 'Rusia' },
    { name: 'Samoa' }, { name: 'San Cristóbal y Nieves' }, { name: 'San Marino' },
    { name: 'San Vicente y las Granadinas' }, { name: 'Santa Lucía' },
    { name: 'Santo Tomé y Príncipe' }, { name: 'Senegal' }, { name: 'Serbia' },
    { name: 'Seychelles' }, { name: 'Sierra Leona' }, { name: 'Singapur' },
    { name: 'Siria' }, { name: 'Somalia' }, { name: 'Sri Lanka' },
    { name: 'Sudáfrica' }, { name: 'Sudán' }, { name: 'Sudán del Sur' },
    { name: 'Suecia' }, { name: 'Suiza' }, { name: 'Surinam' },
    { name: 'Tailandia' }, { name: 'Tanzania' }, { name: 'Tayikistán' },
    { name: 'Timor Oriental' }, { name: 'Togo' }, { name: 'Tonga' },
    { name: 'Trinidad y Tobago' }, { name: 'Túnez' }, { name: 'Turkmenistán' },
    { name: 'Turquía' }, { name: 'Tuvalu' }, { name: 'Ucrania' },
    { name: 'Uganda' }, { name: 'Uruguay' }, { name: 'Uzbekistán' },
    { name: 'Vanuatu' }, { name: 'Vaticano' }, { name: 'Venezuela' },
    { name: 'Vietnam' }, { name: 'Yemen' }, { name: 'Yibuti' },
    { name: 'Zambia' }, { name: 'Zimbabue' },
  ];
  await prisma.country.createMany({ data: countriesData });
  const venezuela = await prisma.country.findUnique({ where: { name: 'Venezuela' } });

  const statesData = [
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
  ];
  await prisma.state.createMany({ data: statesData });
  const zulia = await prisma.state.findFirst({ where: { name: 'Zulia', countryId: venezuela!.id } });

  const municipalitiesData = [
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
  await prisma.municipality.createMany({ data: municipalitiesData });

  const allMunicipalities = await prisma.municipality.findMany({ where: { stateId: zulia!.id } });
  const muniMap = Object.fromEntries(allMunicipalities.map((m) => [m.name, m.id]));

  const parishesData = [
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
  ];
  await prisma.parish.createMany({ data: parishesData });
  console.log('Ubicaciones creadas.');

  const password = await bcrypt.hash('123456', 10);
  const adminPassword = await bcrypt.hash('admin', 10);

  // ── 2. GENERAR 150 ESTUDIANTES ──
  const TOTAL_STUDENTS = 150;
  const STUDENT_PERSON_START = 7; // personId 1-6 are staff

  // Generate student persons
  const studentPersons: { id: number; firstNames: string; lastNames: string; identificationNumber: string; birthDate: Date; gender: string }[] = [];
  const usedCIs = new Set<number>();

  function generateCI(): string {
    let ci: number;
    do { ci = randInt(25000000, 32000000); } while (usedCIs.has(ci));
    usedCIs.add(ci);
    return `V-${ci}`;
  }

  for (let i = 0; i < TOTAL_STUDENTS; i++) {
    const isMale = Math.random() < 0.5;
    const firstNames = isMale ? pick(maleNames) : pick(femaleNames);
    const lastNames = `${pick(isMale ? maleLastNames : femaleLastNames)} ${pick(isMale ? maleLastNames : femaleLastNames)}`;
    const year = randInt(2008, 2014);
    const month = randInt(1, 12);
    const day = randInt(1, 28);
    studentPersons.push({
      id: STUDENT_PERSON_START + i,
      firstNames,
      lastNames,
      identificationNumber: generateCI(),
      birthDate: new Date(year, month - 1, day),
      gender: isMale ? 'Masculino' : 'Femenino',
    });
  }

  // Staff persons (1-6)
  const staffPersons = [
    { id: 1, firstNames: 'Luisangel', lastNames: 'Ugaz', identificationNumber: 'V-12345678', birthDate: new Date('1990-01-01'), gender: 'Masculino' },
    { id: 2, firstNames: 'Daniela', lastNames: 'Quintero', identificationNumber: 'V-87654321', birthDate: new Date('1985-05-15'), gender: 'Femenino' },
    { id: 3, firstNames: 'Yujenis', lastNames: 'Gonzalez', identificationNumber: 'V-11223344', birthDate: new Date('1982-03-20'), gender: 'Masculino' },
    { id: 4, firstNames: 'Yorhjan', lastNames: 'Fuentes', identificationNumber: 'V-99887766', birthDate: new Date('1988-07-10'), gender: 'Masculino' },
    { id: 5, firstNames: 'Yasmeli', lastNames: 'Villalobos', identificationNumber: 'V-55443322', birthDate: new Date('1992-11-25'), gender: 'Femenino' },
    { id: 6, firstNames: 'Ana', lastNames: 'García Castillo', identificationNumber: 'V-66778899', birthDate: new Date('1991-02-14'), gender: 'Femenino' },
  ];

  await prisma.person.createMany({ data: [...staffPersons, ...studentPersons] });
  console.log('Personas creadas.');

  // ── 3. USUARIOS ──
  // Staff users (1-7)
  await prisma.user.createMany({
    data: [
      { id: 1, personId: 1, roleId: 1, email: 'admin@admin.com', password: adminPassword, phone: '0412-1111111' },
      { id: 2, personId: 2, roleId: 2, email: 'directora@colegio.com', password, phone: '0412-2222222' },
      { id: 3, personId: 3, roleId: 3, email: 'subdirector@colegio.com', password, phone: '0412-3333333' },
      { id: 4, personId: 4, roleId: 4, email: 'administrador@colegio.com', password, phone: '0412-4444444' },
      { id: 5, personId: 5, roleId: 5, email: 'control@colegio.com', password, phone: '0412-5555555' },
      { id: 6, personId: 6, roleId: 6, email: 'ana.garcia@colegio.com', password, phone: '0412-6666666' },
    ],
  });
  console.log('Usuarios creados.');

  // ── 4. ESTUDIANTES ──
  // Define groups
  const INSCRITOS_DIA = 40;    // enrolled, status=true, with monthly payments
  const INSCRITOS_MORA = 25;   // enrolled, status=true, only inscription paid
  const SIN_INSCRIBIR = 50;    // enrolled, status=false, no payments
  const INACTIVOS = 35;        // no enrollment, student.status=false

  // Shuffle student person ids for varied distribution
  const studentPersonIds = studentPersons.map(p => p.id);
  const shuffled = shuffle(studentPersonIds);

  const activeIds = shuffled.slice(0, INSCRITOS_DIA + INSCRITOS_MORA);
  const pendingIds = shuffled.slice(INSCRITOS_DIA + INSCRITOS_MORA, INSCRITOS_DIA + INSCRITOS_MORA + SIN_INSCRIBIR);
  const inactiveIds = shuffled.slice(INSCRITOS_DIA + INSCRITOS_MORA + SIN_INSCRIBIR);

  const studentsData = [
    ...activeIds.map(id => ({ personId: id, birthCountry: 'Venezuela', state: 'Zulia', municipality: 'Maracaibo', parish: 'Bolívar', currentParish: 'Bolívar', previousSchool: 'U.E. Anterior', address: 'Dirección de muestra', status: true, admissionDate: new Date('2025-07-01') })),
    ...pendingIds.map(id => ({ personId: id, birthCountry: 'Venezuela', state: 'Zulia', municipality: 'Maracaibo', parish: 'Bolívar', currentParish: 'Bolívar', previousSchool: 'U.E. Anterior', address: 'Dirección de muestra', status: true, admissionDate: new Date('2025-07-01') })),
    ...inactiveIds.map(id => ({ personId: id, birthCountry: 'Venezuela', state: 'Zulia', municipality: 'Maracaibo', parish: 'Bolívar', currentParish: 'Bolívar', previousSchool: 'U.E. Anterior', address: 'Dirección de muestra', status: false, admissionDate: new Date('2024-09-01') })),
  ];
  await prisma.student.createMany({ data: studentsData });
  console.log('Estudiantes creados.');

  // Get student DB ids (1:1 mapping since we insert in order)
  const allStudents = await prisma.student.findMany({ orderBy: { id: 'asc' } });
  const activeStudents = allStudents.filter(s => s.status);

  // ── 5. REPRESENTANTES ──
  // Create ~75 representative persons + users
  const REP_COUNT = 70;
  const repPersonStart = STUDENT_PERSON_START + TOTAL_STUDENTS;

  const repPersons: { id: number; firstNames: string; lastNames: string; identificationNumber: string; birthDate: Date; gender: string }[] = [];
  for (let i = 0; i < REP_COUNT; i++) {
    const isMale = Math.random() < 0.5;
    const firstNames = isMale ? pick(maleNames) : pick(femaleNames);
    const lastNames = `${pick(isMale ? maleLastNames : femaleLastNames)} ${pick(isMale ? maleLastNames : femaleLastNames)}`;
    repPersons.push({
      id: repPersonStart + i,
      firstNames,
      lastNames,
      identificationNumber: generateCI(),
      birthDate: new Date(randInt(1970, 1995), randInt(0, 11), randInt(1, 28)),
      gender: isMale ? 'Masculino' : 'Femenino',
    });
  }
  await prisma.person.createMany({ data: repPersons });
  console.log('Personas representantes creadas.');

  const repUsersData = repPersons.map((p, i) => ({
    id: 7 + i, // user ids 7+
    personId: p.id,
    roleId: 7,
    email: `representante${i + 1}@correo.com`,
    password,
    phone: `0412-${String(1000000 + i).slice(1)}`,
  }));
  await prisma.user.createMany({ data: repUsersData });
  console.log('Usuarios representantes creados.');

  const repUsers = await prisma.user.findMany({ where: { roleId: 7 }, orderBy: { id: 'asc' } });
  const repRecords = repUsers.map((u, i) => ({
    userId: u.id,
    relationship: pick(representativeRelations),
    occupation: pick(occupations),
  }));
  await prisma.representative.createMany({ data: repRecords });
  console.log('Representantes creados.');

  // ── 6. EMPLEADOS ──
  await prisma.employee.createMany({
    data: [
      { userId: 2, baseHourRate: 0, hireDate: new Date('2020-01-15') },
      { userId: 3, baseHourRate: 0, hireDate: new Date('2021-03-01') },
      { userId: 4, baseHourRate: 0, hireDate: new Date('2022-06-01') },
      { userId: 5, baseHourRate: 0, hireDate: new Date('2023-09-01') },
      { userId: 6, baseHourRate: 12.5, hireDate: new Date('2020-09-01') },
    ],
  });
  console.log('Empleados creados.');

  // ── 7. STUDENT REPRESENTATIVE ──
  const representatives = await prisma.representative.findMany({ orderBy: { id: 'asc' } });
  const studentRepsData: { studentId: number; representativeId: number }[] = [];
  // Distribute: each representative gets ~2 students
  for (let i = 0; i < allStudents.length; i++) {
    const repIdx = i % representatives.length;
    studentRepsData.push({ studentId: allStudents[i].id, representativeId: representatives[repIdx].id });
  }
  await prisma.studentRepresentative.createMany({ data: studentRepsData });
  console.log('Relaciones estudiante-representante creadas.');

  // ── 8. HIGH SCHOOL LEVELS ──
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

  // ── 9. SCHOOL YEAR ──
  await prisma.schoolYear.createMany({
    data: [
      { id: 1, name: '2025-2026', startDate: new Date('2025-07-01'), endDate: new Date('2026-06-30'), isActive: true },
    ],
  });
  console.log('Año escolar creado.');

  // ── 10. PERIODS ──
  await prisma.period.createMany({
    data: [
      { id: 1, schoolYearId: 1, period: '1er Lapso', startDate: new Date('2025-09-15'), endDate: new Date('2025-12-19') },
      { id: 2, schoolYearId: 1, period: '2do Lapso', startDate: new Date('2026-01-12'), endDate: new Date('2026-04-10') },
      { id: 3, schoolYearId: 1, period: '3er Lapso', startDate: new Date('2026-04-13'), endDate: new Date('2026-06-30') },
    ],
  });
  console.log('Períodos creados.');

  // ── 11. SECTIONS ──
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

  // ── 12. STUDENT SECTIONS + 13. STUDENT ENROLLMENTS ──
  // Only active students (INSCRITOS_DIA + INSCRITOS_MORA + SIN_INSCRIBIR = 115)
  const studentsWithEnrollment = allStudents.filter(s => s.status); // 115

  const studentSectionsData: { studentId: number; sectionId: number; enrollmentDate: Date; status: boolean }[] = [];
  const enrollmentsData: { studentId: number; schoolYearId: number; sectionId: number; enrollmentDate: Date; status: boolean }[] = [];

  // Distribute evenly across 10 sections
  for (let i = 0; i < studentsWithEnrollment.length; i++) {
    const sectionIdx = i % sections.length;
    const section = sections[sectionIdx];
    // First INSCRITOS_DIA + INSCRITOS_MORA have enrollment.status = true
    const isEnrolled = i < (INSCRITOS_DIA + INSCRITOS_MORA);
    studentSectionsData.push({
      studentId: studentsWithEnrollment[i].id,
      sectionId: section.id,
      enrollmentDate: new Date('2025-09-15'),
      status: true,
    });
    enrollmentsData.push({
      studentId: studentsWithEnrollment[i].id,
      schoolYearId: 1,
      sectionId: section.id,
      enrollmentDate: new Date('2025-09-15'),
      status: isEnrolled,
    });
  }
  await prisma.studentSection.createMany({ data: studentSectionsData });
  console.log('Inscripciones en secciones creadas.');

  await prisma.studentEnrollment.createMany({ data: enrollmentsData });
  console.log('Matrículas oficiales creadas.');

  // ── 14. FEES (11 tipos) ──
  const months = [
    { name: 'Inscripción', value: 55, startAt: new Date('2025-07-01'), endAt: new Date('2025-10-31') },
    { name: 'Septiembre', value: 380, startAt: new Date('2025-09-01'), endAt: new Date('2025-09-30') },
    { name: 'Octubre', value: 380, startAt: new Date('2025-10-01'), endAt: new Date('2025-10-31') },
    { name: 'Noviembre', value: 380, startAt: new Date('2025-11-01'), endAt: new Date('2025-11-30') },
    { name: 'Diciembre', value: 380, startAt: new Date('2025-12-01'), endAt: new Date('2025-12-31') },
    { name: 'Enero', value: 380, startAt: new Date('2026-01-01'), endAt: new Date('2026-01-31') },
    { name: 'Febrero', value: 380, startAt: new Date('2026-02-01'), endAt: new Date('2026-02-28') },
    { name: 'Marzo', value: 380, startAt: new Date('2026-03-01'), endAt: new Date('2026-03-31') },
    { name: 'Abril', value: 380, startAt: new Date('2026-04-01'), endAt: new Date('2026-04-30') },
    { name: 'Mayo', value: 380, startAt: new Date('2026-05-01'), endAt: new Date('2026-05-31') },
    { name: 'Junio', value: 380, startAt: new Date('2026-06-01'), endAt: new Date('2026-06-30') },
  ];

  const feesData = months.map((m, i) => ({
    id: i + 1,
    name: m.name,
    schoolYearId: 1,
    value: m.value,
    createdAt: new Date('2025-07-01'),
    startAt: m.startAt,
    endAt: m.endAt,
  }));
  await prisma.fee.createMany({ data: feesData });
  console.log('Aranceles creados.');

  // ── 15. PAYMENT METHODS ──
  await prisma.paymentMethod.createMany({
    data: [
      { id: 1, type: 'Efectivo', active: true },
      { id: 2, type: 'Transferencia', active: true },
      { id: 3, type: 'Pago Móvil', active: true },
    ],
  });
  console.log('Métodos de pago creados.');

  // ── 16. EXCHANGE RATES ──
  await prisma.exchange.createMany({
    data: [
      { id: 1, rate: 55.2, date: new Date('2025-09-01') },
      { id: 2, rate: 60.0, date: new Date('2025-10-01') },
    ],
  });
  console.log('Tasas de cambio creadas.');

  // ── 17. PAYMENTS + STUDENT FEES ──
  // Students with active enrollment: first 65 (40 al día + 25 morosos)
  const enrolledStudents = studentsWithEnrollment.slice(0, INSCRITOS_DIA + INSCRITOS_MORA);
  const alDiaStudents = studentsWithEnrollment.slice(0, INSCRITOS_DIA);
  const morososStudents = studentsWithEnrollment.slice(INSCRITOS_DIA, INSCRITOS_DIA + INSCRITOS_MORA);

  const paymentMethods = [1, 2, 3];
  let paymentId = 0;
  let studentFeeId = 0;
  const paymentsData: any[] = [];
  const studentFeesData: { id: number; studentId: number; feeId: number; paymentId: number; status: boolean }[] = [];

  function addPayment(student: typeof enrolledStudents[0], feeId: number, payerName: string, payerId: string) {
    paymentId++;
    const pm = pick(paymentMethods);
    const currency = pm === 1 ? $Enums.Currency.VES : pick([$Enums.Currency.VES, $Enums.Currency.USD]);
    const totalAmount = currency === $Enums.Currency.USD ? 10 : (feeId === 1 ? 55 : 380);

    paymentsData.push({
      id: paymentId,
      paymentMethodId: pm,
      exchangeId: currency === $Enums.Currency.VES ? pick([1, 2]) : null,
      totalAmount,
      currency,
      paymentDate: new Date(2025, pick([8, 9, 10]), randInt(1, 28)),
      reference: `REF-${String(paymentId).padStart(3, '0')}`,
      payerName,
      payerIdentification: payerId,
      payerPhone: `0412-${String(1000000 + paymentId).slice(1)}`,
      status: true,
    });

    studentFeeId++;
    studentFeesData.push({
      id: studentFeeId,
      studentId: student.id,
      feeId,
      paymentId,
      status: true,
    });
  }

  // Get a representative name for each student
  // We'll use the first representative of each student
  const repMap = new Map<number, { name: string; id: string }>();
  for (const sr of studentRepsData) {
    if (!repMap.has(sr.studentId)) {
      const rep = representatives.find(r => r.id === sr.representativeId);
      if (rep) {
        const repPerson = repPersons.find(p => p.id === repUsers.find(u => u.id === rep.userId)?.personId);
        if (repPerson) {
          repMap.set(sr.studentId, {
            name: `${repPerson.firstNames} ${repPerson.lastNames}`,
            id: repPerson.identificationNumber,
          });
        }
      }
    }
  }

  // Inscripción payments for ALL 65 enrolled students
  for (const student of enrolledStudents) {
    const rep = repMap.get(student.id) || { name: 'Representante', id: 'V-00000000' };
    addPayment(student, 1, rep.name, rep.id);
  }

  // Monthly payments for the 40 "al día" students
  const monthlyFeeIds = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // Sep-Jun
  for (const student of alDiaStudents) {
    // Each "al día" student has paid between 3 and 6 random months
    const paidMonths = shuffle(monthlyFeeIds).slice(0, randInt(3, 6));
    const rep = repMap.get(student.id) || { name: 'Representante', id: 'V-00000000' };
    for (const feeId of paidMonths) {
      addPayment(student, feeId, rep.name, rep.id);
    }
  }

  await prisma.payment.createMany({ data: paymentsData });
  console.log('Pagos creados.');

  await prisma.studentFee.createMany({ data: studentFeesData });
  console.log('Aranceles por estudiante creados.');

  // ── Sincronizar secuencias auto-increment ──
  const sequences = [
    'Role_id_seq', 'Person_id_seq', 'User_id_seq',
    'Student_id_seq', 'Representative_id_seq', 'Employee_id_seq',
    'StudentRepresentative_id_seq', 'HighSchoolLevel_id_seq',
    'SchoolYear_id_seq', 'Period_id_seq', 'Section_id_seq',
    'StudentSection_id_seq', 'StudentEnrollment_id_seq',
    'Fee_id_seq', 'StudentFee_id_seq', 'PaymentMethod_id_seq', 'Exchange_id_seq',
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
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
