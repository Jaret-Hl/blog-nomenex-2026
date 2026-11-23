// Correos de cotización con el diseño común de NOMENEX.
import { PRECIOS } from "@/config/precios";
import { fmt } from "@/lib/cotizador/textos";
import { calcularCotizacion, pctRazones, type CotizacionCalculo, type Desglose } from "@/lib/pricing/tarifa";
import { plantilla, type Fila, type Seccion } from "@/lib/mail/plantilla";
import type { ContactoInput, CotizacionInput } from "./validacion";

export interface DatosCotizacion {
  folio: string;
  contacto: ContactoInput;
  cotizacion: CotizacionInput;
  quote: Desglose;
}

const periodoTxt = (p: keyof typeof PRECIOS.periodicidad) => PRECIOS.periodicidad[p].texto.toLowerCase();

/** Filas de la cotización (mensual y pago único), reutilizables en otros correos. */
export function filasCotizacion(c: CotizacionInput, q: Desglose) {
  const nombre = c.paquete ? PRECIOS.paquetes[c.paquete] : "";
  const nominas = `${c.nominas} ${c.nominas === 1 ? "nómina" : "nóminas"} ${periodoTxt(c.periodo)}` +
    (c.asimilados ? ` + ${c.asimilados} de asimilados ${periodoTxt(c.periodoAsim)}` : "");

  if (q.aMedida) {
    return {
      mensual: [["Paquete", nombre], ["Colaboradores", String(c.colaboradores)], ["Cotización", "A la medida"]] as Fila[],
      unico: [] as Fila[],
      complementos: [] as string[],
    };
  }

  const pct = Math.round(pctRazones(c.razones) * 100);
  const mensual: Fila[] = [
    ["Paquete", nombre],
    ["Colaboradores", String(c.colaboradores)],
    ["Razones sociales", String(c.razones)],
    ["Registros patronales", String(c.registros)],
    ["Nóminas", nominas],
    ["Paquete (mensual)", fmt(q.paquete)],
  ];
  if (q.razones) mensual.push([`Razones sociales adicionales (+${pct} %)`, fmt(q.razones)]);
  if (q.registros) mensual.push(["Registros patronales adicionales", fmt(q.registros)]);
  if (q.salarios) mensual.push(["Salarios variables o mixtos", fmt(q.salarios)]);
  if (q.nominas) mensual.push(["Nóminas adicionales", fmt(q.nominas)]);
  if (q.complementosMensuales) mensual.push(["Complementos mensuales", fmt(q.complementosMensuales)]);
  mensual.push(["Subtotal", fmt(q.subtotal)], ["IVA 16 %", fmt(q.iva)], ["Total mensual con IVA", fmt(q.totalMensual)]);

  const unico: Fila[] = q.complementosUnicos > 0
    ? [["Accesorios de pago único", fmt(q.complementosUnicos)], ["IVA 16 %", fmt(q.ivaUnico)], ["Total pago único con IVA", fmt(q.totalUnico)]]
    : [];

  const complementos = q.detalle.map((d) =>
    d.tipo === "unico" ? `${d.nombre}: ${fmt(d.costo)} pago único` : `${d.nombre}: ${fmt(d.costo)} al mes`
  );
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
    nota: `Cifras en pesos mexicanos, sujetas a validación. Vigencia de ${PRECIOS.tarifa.vigenciaDias} días naturales. Un asesor de NOMENEX te contactará para confirmar tu propuesta.`,
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

/** Cálculo a partir de la cotización validada (usado por las acciones del servidor). */
export function calcularDesdeInput(c: CotizacionInput): Desglose {
  return calcularCotizacion({ ...c, paquete: c.paquete ?? "basico" } as CotizacionCalculo);
}
