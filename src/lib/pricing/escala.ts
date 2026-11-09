import { PRECIOS, type PaqueteId } from '@/config/precios';

/**
 * Precio mensual del paquete antes de sedes y complementos.
 * Devuelve null cuando la cotización es a la medida (más colaboradores que el máximo).
 */
export function precioPaquete(colaboradores: number, paquete: PaqueteId): number | null {
  if (!Number.isFinite(colaboradores) || colaboradores < 1) return 0;
  if (colaboradores > PRECIOS.escala.maximoColaboradores) return null;

  const { cuotaBase, tramos } = PRECIOS.escala;
  let precio = cuotaBase;
  for (const t of tramos) {
    const enTramo = Math.max(0, Math.min(colaboradores, t.hasta) - (t.desde - 1));
    precio += enTramo * t.precioPorColaborador;
  }

  const cfg = PRECIOS.paquetes[paquete];
  return Math.max(cfg.minimo, precio + colaboradores * cfg.cargoPorColaborador);
}
