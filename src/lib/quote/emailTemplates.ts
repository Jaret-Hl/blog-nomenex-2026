// Correos de cotización. Todo dato del usuario pasa por escapeHtml.
import type { QuoteResult } from "@/lib/pricing/types";
import { porcentajeSedes } from "@/lib/pricing/sedes";
import { PRECIOS } from "@/config/precios";
import { fmt, SEDES_LARGO } from "@/lib/cotizador/textos";
import type { ContactoInput, CotizacionInput } from "./validacion";

export function escapeHtml(texto: string): string {
  const mapa: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return texto.replace(/[&<>"']/g, (c) => mapa[c]);
}

type Fila = [string, string];

interface Datos {
  folio: string;
  contacto: ContactoInput;
  cotizacion: CotizacionInput;
  quote: QuoteResult;
}

function filas({ cotizacion, quote }: Datos) {
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
  const mensual: Fila[] = [
    ["Paquete", nombrePaquete],
    ["Colaboradores", String(n)],
    ["Sedes", `${sedesTxt}${pct ? ` (+${pct} %)` : ""}`],
    ["Paquete (mensual)", fmt(b.paquete)],
    ["Cargo por sedes", fmt(b.sedes)],
  ];
  if (bio > 0) mensual.push(["Biométricos en comodato", fmt(bio)]);
  const compMensual = b.complementosMensuales - bio;
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

function tabla(rows: Fila[], resaltarUltima = false): string {
  const cuerpo = rows
    .map(([a, b], i) => {
      const negrita = resaltarUltima && i === rows.length - 1 ? "font-weight:bold;" : "";
      return (
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;${negrita}">${escapeHtml(a)}</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;${negrita}">${escapeHtml(b)}</td></tr>`
      );
    })
    .join("");
  return `<table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px">${cuerpo}</table>`;
}

function lista(items: string[]): string {
  if (!items.length) return "";
  return (
    `<p style="margin:16px 0 4px"><strong>Complementos</strong></p>` +
    `<ul style="margin:0;padding-left:20px;font-size:14px">${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`
  );
}

function envoltorio(cuerpo: string): string {
  return `<div style="font-family:Arial,sans-serif;color:#1f2937;max-width:600px">${cuerpo}</div>`;
}

export function asuntoCliente(folio: string): string {
  return `Tu cotización NOMENEX · Folio ${folio}`;
}

export function asuntoInterno(folio: string, empresa: string, n: number): string {
  const limpia = empresa.replace(/[\r\n]+/g, " ").slice(0, 80);
  return `Nueva cotización ${folio}: ${limpia} (${n} colaboradores)`;
}

export function buildClientEmail(d: Datos): string {
  const r = filas(d);
  return envoltorio(`
    <h2 style="font-size:20px">Hola ${escapeHtml(d.contacto.nombre)}</h2>
    <p>Gracias por cotizar con NOMENEX. Folio de tu cotización: <strong>${escapeHtml(d.folio)}</strong></p>
    ${tabla(r.mensual, true)}
    ${r.unico.length ? `<p style="margin:16px 0 4px"><strong>Pago único</strong></p>${tabla(r.unico, true)}` : ""}
    ${lista(r.complementos)}
    <p style="margin-top:20px">Las cifras están en pesos mexicanos y sujetas a validación. Un asesor de NOMENEX te contactará para confirmar tu propuesta.</p>
  `);
}

export function buildInternalEmail(d: Datos): string {
  const r = filas(d);
  const contacto: Fila[] = [
    ["Folio", d.folio],
    ["Nombre", d.contacto.nombre],
    ["Empresa", d.contacto.empresa],
    ["Correo", d.contacto.correo],
    ["Teléfono", d.contacto.telefono || "No proporcionado"],
  ];
  return envoltorio(`
    <h2 style="font-size:20px">Nueva cotización recibida</h2>
    <p><strong>Contacto</strong></p>
    ${tabla(contacto)}
    <p style="margin:16px 0 4px"><strong>Cotización</strong></p>
    ${tabla(r.mensual, true)}
    ${r.unico.length ? `<p style="margin:16px 0 4px"><strong>Pago único</strong></p>${tabla(r.unico, true)}` : ""}
    ${lista(r.complementos)}
    <p style="margin-top:16px;font-size:12px;color:#6b7280">Responde a este correo para escribirle directamente al cliente.</p>
  `);
}
