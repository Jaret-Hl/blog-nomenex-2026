// Motor de precios. Replica las reglas de la Tarifa 2027 del cotizador (ver config/precios.ts).
import { PRECIOS, type Complemento, type PaqueteId, type Periodo, type Salarios } from "@/config/precios";

const T = PRECIOS.tarifa;

export interface CotizacionCalculo {
  colaboradores: number;
  razones: number;
  registros: number;
  salarios: Salarios;
  nominas: number;
  periodo: Periodo;
  asimilados: number;
  periodoAsim: Periodo;
  paquete: PaqueteId;
  complementos: string[];
  equipos: number;
}

export interface Desglose {
  aMedida: boolean;
  paquete: number;
  razones: number;
  registros: number;
  salarios: number;
  nominas: number;
  complementosMensuales: number;
  subtotal: number;
  iva: number;
  totalMensual: number;
  complementosUnicos: number;
  ivaUnico: number;
  totalUnico: number;
  porColaborador: number;
  detalle: { id: string; nombre: string; tipo: string; costo: number }[];
}

const redondear = (v: number) => (T.redondeo ? Math.round(v / T.redondeo) * T.redondeo : v);

/** Cuota del paquete: el precio de lista, con el piso de inflación como control. */
export function cuotaNomenex(p: PaqueteId): number {
  const piso = Math.round((T.cuotaActual * (1 + T.inflacion) * T.lista5[p]) / T.lista5.profesional * 100) / 100;
  return Math.max(T.lista5[p], piso);
}

/** Precio del paquete antes de cargos adicionales. null = cotización a la medida. */
export function precioPaquete(n: number, p: PaqueteId, periodo: Periodo): number | null {
  if (!n || n < 1) return 0;
  if (n > T.maximo) return null;
  let variable = 0;
  for (const t of T.tramos) variable += Math.max(0, Math.min(n, t.hasta) - (t.desde - 1)) * (t.base + t.extra[p]);
  return redondear((cuotaNomenex(p) + variable * (1 - T.descuento)) * PRECIOS.periodicidad[periodo].factor);
}

/** Porcentaje por razones sociales (sobre el precio del paquete). */
export const pctRazones = (razones: number): number =>
  (PRECIOS.razones.find((r) => razones <= r.hasta) ?? PRECIOS.razones[0]).pct;

export const bioIncluidos = (p: PaqueteId | null): number => (p === "profesional" || p === "premium" ? 1 : 0);

export function costoComplemento(k: Complemento, n: number, equipos: number, p: PaqueteId | null): number {
  if (k.tipo === "equipo") return k.precio * Math.max(0, equipos - bioIncluidos(p));
  if (k.tipo === "unico") return (k.base ?? 0) + k.precio * n;
  return k.precio * n;
}

/** Calcula la cotización completa. Mismo orden y fórmulas que el cotizador de referencia. */
export function calcularCotizacion(c: CotizacionCalculo): Desglose {
  const n = c.colaboradores;
  const v = precioPaquete(n, c.paquete, c.periodo);
  const sel = PRECIOS.complementos.filter((k) => c.complementos.includes(k.id));
  const detalle = sel.map((k) => ({ id: k.id, nombre: k.nombre, tipo: k.tipo, costo: costoComplemento(k, n, c.equipos, c.paquete) }));
  const mensualesComp = detalle.filter((d) => d.tipo !== "unico").reduce((a, d) => a + d.costo, 0);
  const unicos = detalle.filter((d) => d.tipo === "unico").reduce((a, d) => a + d.costo, 0);

  if (v === null) {
    return { aMedida: true, paquete: 0, razones: 0, registros: 0, salarios: 0, nominas: 0, complementosMensuales: mensualesComp,
      subtotal: 0, iva: 0, totalMensual: 0, complementosUnicos: unicos, ivaUnico: unicos * PRECIOS.iva,
      totalUnico: unicos * (1 + PRECIOS.iva), porColaborador: 0, detalle };
  }

  const razones = redondear(v * pctRazones(c.razones));
  const registros = Math.max(0, c.registros - PRECIOS.registros.incluidos) * PRECIOS.registros.cargo;
  const salarios = redondear(v * PRECIOS.salarios[c.salarios]);
  const nominas = redondear(
    Math.max(0, c.nominas - PRECIOS.nominas.incluidas) * PRECIOS.nominas.cargo * PRECIOS.periodicidad[c.periodo].factor +
      c.asimilados * PRECIOS.nominas.cargo * PRECIOS.periodicidad[c.periodoAsim].factor
  );
  const subtotal = v + razones + salarios + registros + nominas + mensualesComp;
  const iva = subtotal * PRECIOS.iva;

  return {
    aMedida: false, paquete: v, razones, registros, salarios, nominas,
    complementosMensuales: mensualesComp, subtotal, iva, totalMensual: subtotal + iva,
    complementosUnicos: unicos, ivaUnico: unicos * PRECIOS.iva, totalUnico: unicos * (1 + PRECIOS.iva),
    porColaborador: subtotal / n, detalle,
  };
}
