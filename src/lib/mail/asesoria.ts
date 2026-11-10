// Correos de confirmación de asesoría (cliente y notificación interna).
import { escapeHtml, plantilla, type Fila, type Seccion } from "./plantilla";
import { filasCotizacion } from "@/lib/quote/emailTemplates";
import type { CotizacionInput } from "@/lib/quote/validacion";
import type { QuoteResult } from "@/lib/pricing/types";

export interface DatosAsesoria {
  folio: string;
  inicio: Date;
  fin: Date;
  zona: string;
  contacto: { nombre: string; empresa?: string; correo: string; telefono?: string };
  joinUrl?: string;
  cotizacion?: { cotizacion: CotizacionInput; quote: QuoteResult } | null;
}

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function fechaLarga(d: Date, zona: string): string {
  return capitalizar(
    d.toLocaleDateString("es-MX", { timeZone: zona, weekday: "long", day: "numeric", month: "long", year: "numeric" })
  );
}

const hora = (d: Date, zona: string) =>
  d.toLocaleTimeString("es-MX", { timeZone: zona, hour: "2-digit", minute: "2-digit" });

function seccionesComunes(d: DatosAsesoria): Seccion[] {
  const minutos = Math.round((d.fin.getTime() - d.inicio.getTime()) / 60_000);
  const secciones: Seccion[] = [
    {
      titulo: "Sesión",
      filas: [
        ["Fecha", fechaLarga(d.inicio, d.zona)],
        ["Horario", `${hora(d.inicio, d.zona)} – ${hora(d.fin, d.zona)} (${d.zona})`],
        ["Duración", `${minutos} minutos`],
        ["Folio", d.folio],
      ],
    },
  ];

  if (d.cotizacion) {
    const r = filasCotizacion(d.cotizacion.cotizacion, d.cotizacion.quote);
    if (r.mensual.length) secciones.push({ titulo: "Tu cotización", filas: r.mensual });
    if (r.complementos.length) secciones.push({ titulo: "Complementos", lista: r.complementos });
  }
  return secciones;
}

export function asuntoAsesoriaCliente(d: DatosAsesoria): string {
  return `Asesoría confirmada · ${fechaLarga(d.inicio, d.zona)}`;
}

export function asuntoAsesoriaInterno(d: DatosAsesoria): string {
  const empresa = (d.contacto.empresa || d.contacto.nombre).replace(/[\r\n]+/g, " ").slice(0, 80);
  return `Nueva asesoría: ${empresa} · ${fechaLarga(d.inicio, d.zona)}`;
}

export function buildAsesoriaCliente(d: DatosAsesoria): string {
  const contacto: Fila[] = [["Nombre", d.contacto.nombre]];
  if (d.contacto.empresa) contacto.push(["Empresa", d.contacto.empresa]);
  contacto.push(["Correo", d.contacto.correo]);
  if (d.contacto.telefono) contacto.push(["Teléfono", d.contacto.telefono]);

  return plantilla({
    preheader: `Tu asesoría está agendada para el ${fechaLarga(d.inicio, d.zona)}`,
    titulo: "Tu asesoría está agendada",
    intro: `Hola ${d.contacto.nombre}. Confirmamos tu sesión con el equipo de NOMENEX. Agrégala a tu calendario con el archivo adjunto.`,
    secciones: [...seccionesComunes(d), { titulo: "Tus datos", filas: contacto }],
    boton: d.joinUrl ? { texto: "Unirse a la reunión de Teams", url: d.joinUrl } : undefined,
    nota: "Si necesitas reagendar, responde a este correo. Folio de referencia: " + d.folio,
  });
}

export function buildAsesoriaInterno(d: DatosAsesoria): string {
  const contacto: Fila[] = [["Nombre", d.contacto.nombre], ["Correo", d.contacto.correo]];
  if (d.contacto.empresa) contacto.push(["Empresa", d.contacto.empresa]);
  if (d.contacto.telefono) contacto.push(["Teléfono", d.contacto.telefono]);

  return plantilla({
    preheader: `Nueva asesoría de ${d.contacto.nombre}`,
    titulo: "Nueva asesoría agendada",
    intro: "Se agendó una sesión desde el cotizador. El evento ya está en el calendario de NOMENEX.",
    secciones: [...seccionesComunes(d), { titulo: "Contacto", filas: contacto }],
    boton: d.joinUrl ? { texto: "Abrir reunión de Teams", url: d.joinUrl } : undefined,
    nota: "Responde a este correo para escribirle directamente al cliente.",
  });
}
