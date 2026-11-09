import { PRECIOS, type PaqueteId } from '@/config/precios';
import type { QuoteResult, WizardState } from './types';
import { precioPaquete } from './escala';
import { cargoSedes } from './sedes';
import { calcularComplementos } from './complementos';

export function calculateQuote(state: WizardState): QuoteResult {
  const colaboradores = Number(state.step1?.employees ?? 0);
  const sedes = Number(state.step1?.locations ?? 1);
  const paqueteId = state.step2?.packageId as PaqueteId | undefined;

  if (!colaboradores || !paqueteId || !(paqueteId in PRECIOS.paquetes)) {
    return { total: 0, aMedida: false };
  }

  const paqueteNombre = PRECIOS.paquetes[paqueteId].nombre;
  const paquete = precioPaquete(colaboradores, paqueteId);
  if (paquete === null) {
    return { total: null, aMedida: true, package: paqueteNombre, employees: colaboradores };
  }

  // Biométricos en comodato: son un complemento por equipo, según la cantidad indicada.
  const equipos = state.step3?.bioRequired ? Number(state.step3.bioCount ?? 0) : 0;
  const ids = new Set(state.step2?.complementos ?? []);
  if (equipos > 0) ids.add('bio');
  else ids.delete('bio');

  const comp = calcularComplementos([...ids], colaboradores, equipos);
  const cargoSede = cargoSedes(paquete, sedes);

  const subtotal = paquete + cargoSede + comp.mensual;
  const iva = subtotal * PRECIOS.iva;
  const ivaUnico = comp.unico * PRECIOS.iva;

  return {
    total: subtotal + iva,
    aMedida: false,
    package: paqueteNombre,
    employees: colaboradores,
    breakdown: {
      paquete,
      sedes: cargoSede,
      complementosMensuales: comp.mensual,
      subtotal,
      iva,
      totalMensual: subtotal + iva,
      complementosUnicos: comp.unico,
      ivaUnico,
      totalUnico: comp.unico + ivaUnico,
      porColaborador: subtotal / colaboradores,
    },
    complementos: comp.detalle,
  };
}
