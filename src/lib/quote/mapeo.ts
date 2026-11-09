// Une la cotización del cotizador con el motor de cálculo (pricing). Única fuente de totales.
import type { WizardState } from "@/lib/pricing/types";
import { calculateQuote } from "@/lib/pricing/calculateQuote";
import type { CotizacionInput } from "./validacion";
import type { PaqueteId } from "@/config/precios";

export function toWizardState(c: CotizacionInput): WizardState {
  return {
    step1: { employees: c.colaboradores, locations: c.sedes },
    step2: { packageId: c.paquete, complementos: c.complementos },
    step3: { bioRequired: c.complementos.includes("bio"), bioCount: c.equipos },
  };
}

export function cotizar(c: CotizacionInput) {
  return calculateQuote(toWizardState(c));
}

export function cotizarPaquete(c: CotizacionInput, paquete: PaqueteId) {
  return cotizar({ ...c, paquete });
}
