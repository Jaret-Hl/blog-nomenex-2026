import { PRECIOS } from '@/config/precios';

/** Porcentaje de cargo por sedes según el número de sedes, centros de trabajo o sucursales. */
export function porcentajeSedes(sedes: number): number {
  const n = Math.max(1, Math.floor(sedes || 1));
  const tramo = PRECIOS.sedes.find(s => n >= s.desde && n <= s.hasta);
  return tramo?.porcentaje ?? 0;
}

/** Cargo por sedes: porcentaje sobre el precio del paquete. */
export function cargoSedes(precioPaquete: number, sedes: number): number {
  return precioPaquete * porcentajeSedes(sedes);
}
