// Genera la tarjeta de contacto (vCard 3.0) de una persona.
const escapar = (t: string) =>
  t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export interface DatosVcard {
  grado: string;
  nombres: string;
  apellidos: string;
  nombre: string;
  cargo: string;
  empresa: string;
  telefono?: string;
  correo: string;
  sitio?: string;
}

export function generarVcard(p: DatosVcard): string {
  const lineas = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapar(p.apellidos)};${escapar(p.nombres)};;${escapar(p.grado)};`,
    `FN:${escapar(`${p.grado} ${p.nombre}`)}`,
    `ORG:${escapar(p.empresa)}`,
    `TITLE:${escapar(p.cargo)}`,
  ];
  if (p.telefono) lineas.push(`TEL;TYPE=WORK,VOICE:+52${p.telefono}`);
  lineas.push(`EMAIL;TYPE=WORK:${p.correo}`);
  if (p.sitio) lineas.push(`URL:${p.sitio}`);
  lineas.push("END:VCARD");
  return lineas.join("\r\n") + "\r\n";
}

/** 4421058939 -> "442 105 8939" */
export const formatearTelefono = (t: string) => t.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
