// Textos y formatos compartidos por la interfaz y los correos.
import { PRECIOS, type Complemento, type PaqueteId } from "@/config/precios";
import { bioIncluidos } from "@/lib/pricing/tarifa";

export const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-MX");

/** Texto para búsquedas: sin mayúsculas ni acentos. */
export const normalizar = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function etiquetaComplemento(k: Complemento, paquete: PaqueteId | null = null): string {
  if (k.tipo === "equipo") {
    return bioIncluidos(paquete)
      ? `Primero incluido · + $${k.precio.toLocaleString("es-MX")} por equipo adicional al mes`
      : `+ $${k.precio.toLocaleString("es-MX")} por equipo al mes`;
  }
  if (k.tipo === "unico") {
    return `Pago único: $${(k.base ?? 0).toLocaleString("es-MX")}` + (k.precio ? ` + $${k.precio} por colaborador` : "");
  }
  return `+ $${k.precio} por colaborador al mes`;
}

export const textoPeriodo = (p: keyof typeof PRECIOS.periodicidad) => PRECIOS.periodicidad[p].texto;
