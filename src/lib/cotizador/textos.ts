// Textos y formatos compartidos por la interfaz y los correos.
import type { Complemento } from "@/config/precios";

export const SEDES_CORTO: Record<string, string> = { "1": "1", "2": "2", "3": "3", "4": "4 a 5", "6": "más de 5" };
export const SEDES_LARGO: Record<string, string> = {
  "1": "1 sede",
  "2": "2 sedes",
  "3": "3 sedes",
  "4": "4 a 5 sedes",
  "6": "Más de 5 sedes",
};

export const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-MX");

export function etiquetaComplemento(k: Complemento): string {
  if (k.tipo === "equipo") return `+ $${k.precio.toLocaleString("es-MX")} por equipo al mes`;
  if (k.tipo === "unico") return `Pago único: $${(k.base ?? 0).toLocaleString("es-MX")} + $${k.precio} por colaborador`;
  return `+ $${k.precio} por colaborador al mes`;
}
