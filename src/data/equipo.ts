// Fuente única del equipo: datos de cada persona y su lugar en el organigrama.
// Para agregar a alguien: copia un objeto, cambia los datos y pon su foto en public/equipo/.
export type Area = "direccion" | "contabilidad" | "ti";

export interface Persona {
  id: string;
  grado: string;
  nombre: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  lema: string;
  area: Area;
  /** id de quien reporta. Solo la dirección tiene null. */
  reportaA: string | null;
  foto: string;
  telefono?: string;
  correo: string;
  servicios: string[];
}

export interface Vacante {
  id: string;
  tipo: "vacante";
  area: Area;
  reportaA: string;
  cargo: string;
}

export type Nodo = Persona | Vacante;

export const esVacante = (n: Nodo): n is Vacante => "tipo" in n;

export const EQUIPO: Nodo[] = [
  {
    id: "cynthia",
    grado: "M.A.",
    nombre: "Cynthia Camelo Inchaustegui",
    nombres: "Cynthia",
    apellidos: "Camelo Inchaustegui",
    cargo: "Gerente de Maquila de Nóminas",
    lema: "Planeación y gestión estratégica de nómina",
    area: "direccion",
    reportaA: null,
    foto: "/equipo/cynthia.webp",
    telefono: "4421058939",
    correo: "gerente.nom@nomenex.com",
    servicios: [
      "Cálculo de nómina y timbrado CFDI",
      "Cálculos IMSS, INFONAVIT e ISN",
      "Control de asistencia con checadores biométricos",
      "Consultoría en contratos, tabuladores y puestos",
    ],
  },
  {
    id: "manuel",
    grado: "C.P.",
    nombre: "Manuel Alejandro Cuevas Acosta",
    nombres: "Manuel Alejandro",
    apellidos: "Cuevas Acosta",
    cargo: "Ejecutivo(a) de Seguridad Social",
    lema: "Cumplimiento social, sin pendientes.",
    area: "contabilidad",
    reportaA: "cynthia",
    foto: "/equipo/manuel.webp",
    correo: "ejec.SS01@nomenex.com",
    servicios: [
      "Movimientos IDSE, SUA y SIPARE",
      "ISN, FONACOT e INFONAVIT",
      "Opiniones de cumplimiento",
    ],
  },
  {
    id: "erika",
    grado: "C.P.",
    nombre: "Erika González Hernández",
    nombres: "Erika",
    apellidos: "González Hernández",
    cargo: "Ejecutivo(a) de Nómina Sr.",
    lema: "Nóminas puntuales, cálculos precisos.",
    area: "contabilidad",
    reportaA: "cynthia",
    foto: "/equipo/erika.webp",
    telefono: "4423152563",
    correo: "analista.nomyss@nomenex.com",
    servicios: [
      "Cálculo y timbrado de su cartera",
      "Revisión de pre-nóminas",
      "Finiquitos y liquidaciones",
    ],
  },
  { id: "vacante-contabilidad", tipo: "vacante", area: "contabilidad", reportaA: "cynthia", cargo: "Por definir" },
  {
    id: "jaret",
    grado: "Ing.",
    nombre: "Jaret Gadir Hernández López",
    nombres: "Jaret Gadir",
    apellidos: "Hernández López",
    cargo: "Ejecutivo(a) TI – Gestión de Checadores",
    lema: "Asistencia confiable, datos a tiempo.",
    area: "ti",
    reportaA: "cynthia",
    foto: "/equipo/jaret.webp",
    telefono: "4422324208",
    correo: "ejecutivoti@grupocyh.com",
    servicios: [
      "Instalación de biométricos",
      "Reporte de asistencia a nómina",
      "Inventario y comodato",
    ],
  },
  {
    id: "isaac",
    grado: "Ing.",
    nombre: "Isaac Jiménez Hernández",
    nombres: "Isaac",
    apellidos: "Jiménez Hernández",
    cargo: "Ejecutivo(a) TI – Gestión de Nóminas",
    lema: "Tecnología que trabaja para tu nómina.",
    area: "ti",
    reportaA: "cynthia",
    foto: "/equipo/isaac.webp",
    telefono: "4424710864",
    correo: "ejecutivo_erpjr@grupocyh.com",
    servicios: [
      "Parametrización de Rankmi",
      "Accesos, interfaces y respaldos",
      "Soporte y validación de XML",
    ],
  },
  { id: "vacante-ti", tipo: "vacante", area: "ti", reportaA: "cynthia", cargo: "Por definir" },
];
