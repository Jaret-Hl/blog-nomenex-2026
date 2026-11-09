// Catálogo descriptivo de paquetes (textos y servicios). Los precios viven en config/precios.ts.
import data from "@/data/paquetes.json";

export interface ItemServicio {
  texto: string;
  corto?: string;
  desde: 1 | 2 | 3;
}

export interface Servicio {
  grupo: string;
  icono: string;
  items: ItemServicio[];
}

export interface Paquete {
  id: "basico" | "profesional" | "premium";
  nivel: 1 | 2 | 3;
  nombre: string;
  nombreCorto: string;
  etiqueta: string;
  promesa: string;
  destacado: boolean;
  base: string | null;
}

export const paquetes = data.paquetes as Paquete[];
export const servicios = data.servicios as Servicio[];

/** Servicios que se incluyen por primera vez en un nivel (lo que muestra cada tarjeta). */
export function gruposParaNivel(nivel: number): Servicio[] {
  return servicios
    .map((s) => ({ ...s, items: s.items.filter((i) => i.desde === nivel) }))
    .filter((s) => s.items.length > 0);
}
