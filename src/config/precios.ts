/**
 * PRECIOS NOMENEX · fuente única de precios.
 *
 * Para cambiar un precio, edita SOLO este archivo. Ningún otro archivo tiene cifras fijas.
 * Todos los importes son mensuales y antes de IVA, salvo los complementos de tipo "unico" (pago único).
 * Pendiente de validación contra costos (Rankmi, biométricos, representación legal).
 */

export type PaqueteId = 'basico' | 'profesional' | 'premium';
export type TipoComplemento = 'colab' | 'equipo' | 'unico';

export interface PaqueteConfig {
  nombre: string;
  /** Cargo mensual adicional por colaborador. */
  cargoPorColaborador: number;
  /** Mínimo mensual del paquete (0 = sin mínimo). */
  minimo: number;
}

export interface TramoEscala {
  desde: number;
  hasta: number;
  precioPorColaborador: number;
}

export interface TramoSedes {
  desde: number;
  hasta: number;
  /** Porcentaje que se suma sobre el precio del paquete (0.10 = 10 %). */
  porcentaje: number;
}

export interface Complemento {
  id: string;
  grupo: string;
  nombre: string;
  descripcion: string;
  /** colab = por colaborador al mes · equipo = por equipo al mes · unico = pago único */
  tipo: TipoComplemento;
  /** Precio unitario (por colaborador, por equipo o por consultoría según el tipo). */
  precio: number;
  /** Solo para tipo "unico": cuota fija antes del cargo por colaborador. */
  base?: number;
}

export const PRECIOS = {
  /** IVA aplicado al subtotal mensual y a los pagos únicos. */
  iva: 0.16,

  escala: {
    cuotaBase: 2890,
    colaboradoresIncluidos: 5,
    /** Por encima de este número la cotización es a la medida. */
    maximoColaboradores: 200,
    tramos: [
      { desde: 6, hasta: 20, precioPorColaborador: 370 },
      { desde: 21, hasta: 49, precioPorColaborador: 265 },
      { desde: 50, hasta: 119, precioPorColaborador: 210 },
      { desde: 120, hasta: 200, precioPorColaborador: 190 },
    ] as TramoEscala[],
  },

  paquetes: {
    basico: { nombre: 'Paquete Básico', cargoPorColaborador: 0, minimo: 0 },
    profesional: { nombre: 'Paquete Profesional', cargoPorColaborador: 120, minimo: 0 },
    premium: { nombre: 'Paquete Premium', cargoPorColaborador: 220, minimo: 7500 },
  } satisfies Record<PaqueteId, PaqueteConfig>,

  sedes: [
    { desde: 1, hasta: 1, porcentaje: 0 },
    { desde: 2, hasta: 2, porcentaje: 0.1 },
    { desde: 3, hasta: 3, porcentaje: 0.2 },
    { desde: 4, hasta: 5, porcentaje: 0.3 },
    { desde: 6, hasta: Number.POSITIVE_INFINITY, porcentaje: 0.4 },
  ] as TramoSedes[],

  complementos: [
    { id: 'bio', grupo: 'Asistencia y nómina', nombre: 'Biométricos en comodato', descripcion: 'Checadores sincronizados con la nómina, con instalación y soporte.', tipo: 'equipo', precio: 650 },
    { id: 'disp', grupo: 'Asistencia y nómina', nombre: 'Dispersión de nómina', descripcion: 'Pagos interbancarios a todos los colaboradores desde un archivo autorizado.', tipo: 'colab', precio: 15 },
    { id: 'firma', grupo: 'Asistencia y nómina', nombre: 'Firma digital y gestión documental', descripcion: 'Contratos, recibos y documentos firmados y resguardados en línea.', tipo: 'colab', precio: 25 },
    { id: 'vales', grupo: 'Bienestar y beneficios', nombre: 'Vales de despensa', descripcion: 'Integrados a la nómina, con su tratamiento fiscal.', tipo: 'colab', precio: 10 },
    { id: 'benef', grupo: 'Bienestar y beneficios', nombre: 'Beneficios+', descripcion: 'Catálogo de beneficios y descuentos para colaboradores.', tipo: 'colab', precio: 20 },
    { id: 'recon', grupo: 'Bienestar y beneficios', nombre: 'Reconocimiento', descripcion: 'Programa para reconocer logros y comportamientos.', tipo: 'colab', precio: 15 },
    { id: 'onb', grupo: 'Talento y desarrollo', nombre: 'Onboarding', descripcion: 'Contratación e incorporación digital de nuevos colaboradores.', tipo: 'colab', precio: 15 },
    { id: 'lms', grupo: 'Talento y desarrollo', nombre: 'Centro de aprendizaje (LMS)', descripcion: 'Cursos, capacitaciones y seguimiento de avance.', tipo: 'colab', precio: 30 },
    { id: 'desem', grupo: 'Talento y desarrollo', nombre: 'Desempeño, metas y objetivos', descripcion: 'Evaluaciones por competencias y seguimiento de metas.', tipo: 'colab', precio: 30 },
    { id: 'box', grupo: 'Talento y desarrollo', nombre: 'Matriz de talento 9-box', descripcion: 'Identificación de potencial y planes de sucesión.', tipo: 'colab', precio: 15 },
    { id: 'clima', grupo: 'Clima y cultura', nombre: 'Clima y engagement', descripcion: 'Encuestas, resultados y planes de acción.', tipo: 'colab', precio: 20 },
    { id: 'feed', grupo: 'Clima y cultura', nombre: 'Feedback continuo', descripcion: 'Retroalimentación entre líderes y equipos.', tipo: 'colab', precio: 10 },
    { id: 'encu', grupo: 'Clima y cultura', nombre: 'Encuestas y formularios', descripcion: 'Incluye encuestas de salida y de satisfacción.', tipo: 'colab', precio: 10 },
    { id: 'serv', grupo: 'Atención y análisis', nombre: 'Employee Service', descripcion: 'Mesa de atención para solicitudes y dudas de los colaboradores.', tipo: 'colab', precio: 20 },
    { id: 'ana', grupo: 'Atención y análisis', nombre: 'People Analytics', descripcion: 'Tableros de indicadores de rotación, ausentismo y costo de personal.', tipo: 'colab', precio: 25 },
    { id: 'contr', grupo: 'Consultoría NOMENEX', nombre: 'Reestructura de contratos', descripcion: 'Contratos individuales, colectivos y de prestación de servicios.', tipo: 'unico', base: 6000, precio: 150 },
    { id: 'tab', grupo: 'Consultoría NOMENEX', nombre: 'Tabuladores y descripciones de puestos', descripcion: 'Diseño y actualización de tabuladores salariales y perfiles de puesto.', tipo: 'unico', base: 8000, precio: 100 },
    { id: 'nom35', grupo: 'Consultoría NOMENEX', nombre: 'Implementación de la NOM-035', descripcion: 'Políticas, cuestionarios, resultados y acciones de seguimiento.', tipo: 'unico', base: 5000, precio: 80 },
  ] as Complemento[],
} as const;
