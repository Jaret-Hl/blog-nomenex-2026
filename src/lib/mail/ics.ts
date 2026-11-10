// Genera un archivo de calendario (.ics) para agregar la sesión sin enviar invitaciones RSVP.
const escapar = (t: string) =>
  t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

const fechaUtc = (iso: string | Date) =>
  new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

export interface DatosIcs {
  uid: string;
  inicio: string;
  fin: string;
  titulo: string;
  descripcion: string;
  url?: string;
}

export function generarIcs(d: DatosIcs): string {
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NOMENEX//Asesorias//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${d.uid}`,
    `DTSTAMP:${fechaUtc(new Date())}`,
    `DTSTART:${fechaUtc(d.inicio)}`,
    `DTEND:${fechaUtc(d.fin)}`,
    `SUMMARY:${escapar(d.titulo)}`,
    `DESCRIPTION:${escapar(d.descripcion)}`,
    d.url ? `URL:${d.url}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lineas.join("\r\n") + "\r\n";
}
