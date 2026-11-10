// Correos de cotización con el diseño común de NOMENEX.
import type { QuoteResult } from "@/lib/pricing/types";
import { porcentajeSedes } from "@/lib/pricing/sedes";
import { PRECIOS } from "@/config/precios";
import { fmt, SEDES_LARGO } from "@/lib/cotizador/textos";
import { plantilla, type Fila, type Seccion } from "@/lib/mail/plantilla";
import type { ContactoInput, CotizacionInput } from "./validacion";

export interface DatosCotizacion {
  folio: string;
  contacto: ContactoInput;
  cotizacion: CotizacionInput;
  quote: QuoteResult;
}

/** Filas de la cotización (mensual y pago único), reutilizables en otros correos. */
export function filasCotizacion(cotizacion: CotizacionInput, quote: QuoteResult) {
  const n = cotizacion.colaboradores;
  const sedesTxt = SEDES_LARGO[cotizacion.sedes] ?? cotizacion.sedes;
  const pct = Math.round(porcentajeSedes(Number(cotizacion.sedes)) * 100);
  const nombrePaquete = cotizacion.paquete ? PRECIOS.paquetes[cotizacion.paquete].nombre : "";

  if (quote.aMedida || !quote.breakdown) {
    return {
      mensual: [["Paquete", nombrePaquete], ["Colaboradores", String(n)], ["Sedes", sedesTxt], ["Cotización", "A la medida"]] as Fila[],
      unico: [] as Fila[],
      complementos: [] as string[],
    };
  }

  const b = quote.breakdown;
  const bio = quote.complementos?.find((c) => c.id === "bio")?.costo ?? 0;
  const compMensual = b.complementosMensuales - bio;

  const mensual: Fila[] = [
    ["Paquete", nombrePaquete],
    ["Colaboradores", String(n)],
    ["Sedes", `${sedesTxt}${pct ? ` (+${pct} %)` : ""}`],
    ["Paquete (mensual)", fmt(b.paquete)],
    ["Cargo por sedes", fmt(b.sedes)],
  ];
  if (bio > 0) mensual.push(["Biométricos en comodato", fmt(bio)]);
  if (compMensual > 0) mensual.push(["Complementos mensuales", fmt(compMensual)]);
  mensual.push(["Subtotal", fmt(b.subtotal)], ["IVA 16 %", fmt(b.iva)], ["Total mensual con IVA", fmt(b.totalMensual)]);

  const unico: Fila[] =
    b.complementosUnicos > 0
      ? [["Consultoría (pago único)", fmt(b.complementosUnicos)], ["IVA 16 %", fmt(b.ivaUnico)], ["Total pago único con IVA", fmt(b.totalUnico)]]
      : [];

  const complementos = (quote.complementos ?? [])
    .filter((c) => c.id !== "bio")
    .map((c) => (c.tipo === "unico" ? `${c.nombre}: ${fmt(c.costo)} pago único` : `${c.nombre}: ${fmt(c.costo)} al mes`));

  return { mensual, unico, complementos };
}

export function asuntoCliente(folio: string): string {
  return `Tu cotización NOMENEX · ${folio}`;
}

export function asuntoInterno(folio: string, empresa: string, n: number): string {
  const limpia = empresa.replace(/[\r\n]+/g, " ").slice(0, 80);
  return `Nueva cotización ${folio}: ${limpia} (${n} colaboradores)`;
}

function seccionesCotizacion(d: DatosCotizacion): Seccion[] {
  const r = filasCotizacion(d.cotizacion, d.quote);
  const secciones: Seccion[] = [{ titulo: "Resumen mensual", filas: r.mensual }];
  if (r.unico.length) secciones.push({ titulo: "Pago único", filas: r.unico });
  if (r.complementos.length) secciones.push({ titulo: "Complementos", lista: r.complementos });
  return secciones;
}

export function buildClientEmail(d: DatosCotizacion): string {
  return plantilla({
    preheader: `Tu cotización ${d.folio} está lista`,
    titulo: "Tu cotización está lista",
    intro: `Hola ${d.contacto.nombre}. Este es el resumen de tu propuesta. Folio ${d.folio}.`,
    secciones: seccionesCotizacion(d),
    nota: "Cifras en pesos mexicanos, sujetas a validación. Un asesor de NOMENEX te contactará para confirmar tu propuesta.",
  });
}

export function buildInternalEmail(d: DatosCotizacion): string {
  const contacto: Fila[] = [
    ["Folio", d.folio],
    ["Nombre", d.contacto.nombre],
    ["Empresa", d.contacto.empresa],
    ["Correo", d.contacto.correo],
    ["Teléfono", d.contacto.telefono || "No proporcionado"],
  ];
  return plantilla({
    preheader: `Nueva cotización de ${d.contacto.empresa}`,
    titulo: "Nueva cotización recibida",
    intro: "Un cliente solicitó su cotización desde el cotizador.",
    secciones: [{ titulo: "Contacto", filas: contacto }, ...seccionesCotizacion(d)],
    nota: "Responde a este correo para escribirle directamente al cliente.",
  });
}
