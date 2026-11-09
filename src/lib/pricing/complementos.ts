import { PRECIOS, type Complemento } from '@/config/precios';

export function costoComplemento(c: Complemento, colaboradores: number, equipos: number): number {
  switch (c.tipo) {
    case 'equipo':
      return c.precio * equipos;
    case 'unico':
      return (c.base ?? 0) + c.precio * colaboradores;
    default:
      return c.precio * colaboradores;
  }
}

/** Suma los complementos seleccionados: mensuales por un lado y pagos únicos por otro. */
export function calcularComplementos(ids: string[], colaboradores: number, equipos: number) {
  const seleccionados = PRECIOS.complementos.filter(c => ids.includes(c.id));

  const detalle = seleccionados.map(c => ({
    id: c.id,
    nombre: c.nombre,
    tipo: c.tipo,
    costo: costoComplemento(c, colaboradores, equipos),
  }));

  const mensual = detalle.filter(d => d.tipo !== 'unico').reduce((a, d) => a + d.costo, 0);
  const unico = detalle.filter(d => d.tipo === 'unico').reduce((a, d) => a + d.costo, 0);

  return { mensual, unico, detalle };
}
