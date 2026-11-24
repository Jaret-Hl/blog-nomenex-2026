// Precios del cotizador NOMENEX (Tarifa 2027). Para cambiar un importe, edita SOLO este archivo.
// Importes mensuales antes de IVA, salvo los de pago único.
export type PaqueteId = "basico" | "profesional" | "premium";
export type Periodo = "semanal" | "quincenal" | "mensual";
export type Salarios = "fijos" | "variables";
export type TipoComplemento = "colab" | "equipo" | "unico";

export interface Complemento {
  id: string;
  grupo: string;
  nombre: string;
  descripcion: string;
  tipo: TipoComplemento;
  precio: number;
  /** Solo pago único: cuota fija antes del cargo por colaborador. */
  base?: number;
}

export const PRECIOS = {
  iva: 0.16,

  tarifa: {
    /** Cuota de referencia: su versión con inflación es el piso de control de la cuota. */
    cuotaActual: 3227,
    inflacion: 0.035,
    /** De 1 a 5 colaboradores se cobra la cuota fija del paquete (lista5). */
    incluidos: 5,
    maximo: 300,
    /** Descuento sobre el costo por colaborador de los tramos (22 % y luego 15 %). */
    descuento: 0.337,
    /** Los importes mensuales se redondean a múltiplos de este valor. */
    redondeo: 10,
    vigenciaDias: 30,
    lista5: { basico: 2890, profesional: 3490, premium: 7500 } as Record<PaqueteId, number>,
    /** Costo base por colaborador en cada tramo y extra por paquete. */
    tramos: [
      { desde: 6, hasta: 20, base: 370, extra: { basico: 0, profesional: 85, premium: 220 } },
      { desde: 21, hasta: 49, base: 265, extra: { basico: 0, profesional: 55, premium: 160 } },
      { desde: 50, hasta: 119, base: 210, extra: { basico: 0, profesional: 35, premium: 110 } },
      { desde: 120, hasta: 300, base: 190, extra: { basico: 0, profesional: 18, premium: 70 } },
    ],
  },

  /** Factor sobre el precio del paquete según la periodicidad de la nómina principal. PROPUESTA POR VALIDAR. */
  periodicidad: {
    semanal: { factor: 1.2, texto: "Semanal" },
    quincenal: { factor: 1, texto: "Quincenal" },
    mensual: { factor: 0.9, texto: "Mensual" },
  } as Record<Periodo, { factor: number; texto: string }>,

  /** Registros patronales: el primero va incluido; cada adicional suma un cargo fijo. PROPUESTA POR VALIDAR. */
  registros: { incluidos: 1, cargo: 600 },

  /** Cargo porcentual por salarios variables o mixtos. PROPUESTA POR VALIDAR. */
  salarios: { fijos: 0, variables: 0.05 } as Record<Salarios, number>,

  /** Nóminas: el paquete incluye una. Cada adicional (y de asimilados) suma el cargo ajustado por periodicidad. */
  nominas: { incluidas: 1, cargo: 450 },

  /** Cargo porcentual sobre el precio del paquete según las razones sociales. PROPUESTA POR VALIDAR. */
  razones: [
    { hasta: 1, pct: 0 },
    { hasta: 2, pct: 0.1 },
    { hasta: 3, pct: 0.2 },
    { hasta: 5, pct: 0.3 },
    { hasta: Infinity, pct: 0.4 },
  ],

  paquetes: {
    basico: "Paquete Básico",
    profesional: "Paquete Profesional",
    premium: "Paquete Premium",
  } as Record<PaqueteId, string>,

  /** Orden de los grupos en el paso Complementos. */
  ordenGrupos: [
    "Asistencia y nómina",
    "Bienestar y beneficios",
    "Talento y desarrollo",
    "Clima y cultura",
    "Atención, análisis y estructura",
    "Legal laboral",
    "Cumplimiento y trámites",
  ],

  complementos: [
    { id: "bio", grupo: "Asistencia y nómina", nombre: "Checador biométrico en comodato", descripcion: "Checador físico sincronizado con la nómina, con instalación y soporte. Solo se cobra su mantenimiento. El primero va incluido en Profesional y Premium.", tipo: "equipo", precio: 325 },
    { id: "disp", grupo: "Asistencia y nómina", nombre: "Dispersión de nómina", descripcion: "Pagos interbancarios a todos los colaboradores desde un archivo autorizado.", tipo: "colab", precio: 15 },
    { id: "firma", grupo: "Asistencia y nómina", nombre: "Gestión documental", descripcion: "Contratos, recibos y documentos firmados y resguardados en línea.", tipo: "colab", precio: 25 },
    { id: "vales", grupo: "Bienestar y beneficios", nombre: "Vales de despensa", descripcion: "Integrados a la nómina, con su tratamiento fiscal.", tipo: "colab", precio: 10 },
    { id: "benef", grupo: "Bienestar y beneficios", nombre: "Beneficios+", descripcion: "Catálogo de beneficios y descuentos para colaboradores.", tipo: "colab", precio: 20 },
    { id: "recon", grupo: "Bienestar y beneficios", nombre: "Reconocimiento", descripcion: "Programa para reconocer logros y comportamientos.", tipo: "colab", precio: 15 },
    { id: "onb", grupo: "Talento y desarrollo", nombre: "Onboarding", descripcion: "Contratación e incorporación digital de nuevos colaboradores.", tipo: "colab", precio: 15 },
    { id: "lms", grupo: "Talento y desarrollo", nombre: "Centro de aprendizaje (LMS)", descripcion: "Cursos, capacitaciones y seguimiento de avance.", tipo: "colab", precio: 30 },
    { id: "desem", grupo: "Talento y desarrollo", nombre: "Desempeño, metas y objetivos", descripcion: "Evaluaciones por competencias y seguimiento de metas.", tipo: "colab", precio: 30 },
    { id: "clima", grupo: "Clima y cultura", nombre: "Clima y engagement", descripcion: "Encuestas, resultados y planes de acción.", tipo: "colab", precio: 20 },
    { id: "feed", grupo: "Clima y cultura", nombre: "Feedback continuo", descripcion: "Retroalimentación entre líderes y equipos.", tipo: "colab", precio: 10 },
    { id: "encu", grupo: "Clima y cultura", nombre: "Encuestas y formularios", descripcion: "Incluye encuestas de salida y de satisfacción.", tipo: "colab", precio: 10 },
    { id: "serv", grupo: "Atención, análisis y estructura", nombre: "Employee Service", descripcion: "Mesa de atención para solicitudes y dudas de los colaboradores.", tipo: "colab", precio: 20 },
    { id: "ana", grupo: "Atención, análisis y estructura", nombre: "People Analytics", descripcion: "Tableros de indicadores de rotación, ausentismo y costo de personal.", tipo: "colab", precio: 25 },
    { id: "tab", grupo: "Atención, análisis y estructura", nombre: "Tabuladores y descripciones de puestos", descripcion: "Diseño y actualización de tabuladores salariales y perfiles de puesto.", tipo: "unico", base: 8000, precio: 100 },
    { id: "nom35", grupo: "Cumplimiento y trámites", nombre: "Implementación de la NOM-035", descripcion: "Políticas, cuestionarios, resultados y acciones de seguimiento.", tipo: "unico", base: 5000, precio: 80 },
    // Accesorios de pago único (importes de facturas 2026).
    { id: "altarp", grupo: "Cumplimiento y trámites", nombre: "Alta de registro patronal", descripcion: "Trámite de alta del registro patronal ante el IMSS.", tipo: "unico", base: 5000, precio: 0 },
    { id: "silla", grupo: "Cumplimiento y trámites", nombre: "Implementación y análisis de la Ley Silla", descripcion: "Análisis de puestos y medidas para cumplir con la reforma.", tipo: "unico", base: 5000, precio: 0 },
  ] as Complemento[],
};
