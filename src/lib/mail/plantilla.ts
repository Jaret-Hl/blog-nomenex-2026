// Plantilla de correo minimalista (tablas y estilos en línea para compatibilidad con clientes de correo).
const C = { azul: "#24518A", acento: "#FF9933", tinta: "#1F2A37", gris: "#5B6675", linea: "#E5E7EB", fondo: "#F6F7F9" };

export function escapeHtml(texto: string): string {
  const mapa: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return texto.replace(/[&<>"']/g, (c) => mapa[c]);
}

export type Fila = [string, string];

export interface Seccion {
  titulo: string;
  filas?: Fila[];
  lista?: string[];
}

export interface OpcionesPlantilla {
  preheader: string;
  titulo: string;
  intro: string;
  secciones: Seccion[];
  boton?: { texto: string; url: string };
  nota?: string;
}

function filaHtml([etiqueta, valor]: Fila): string {
  const borde = `border-bottom:1px solid ${C.linea};`;
  return (
    `<tr>` +
    `<td style="padding:9px 0;${borde}color:${C.gris};font-size:13px;width:40%;vertical-align:top">${escapeHtml(etiqueta)}</td>` +
    `<td style="padding:9px 0;${borde}color:${C.tinta};font-size:14px;font-weight:600;text-align:right;vertical-align:top">${escapeHtml(valor)}</td>` +
    `</tr>`
  );
}

function seccionHtml(s: Seccion): string {
  const titulo = `<p style="margin:28px 0 6px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${C.gris};font-weight:700">${escapeHtml(s.titulo)}</p>`;
  const filas = s.filas?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${s.filas.map(filaHtml).join("")}</table>`
    : "";
  const lista = s.lista?.length
    ? `<ul style="margin:0;padding:0;list-style:none">${s.lista
        .map((i) => `<li style="padding:7px 0;border-bottom:1px solid ${C.linea};font-size:14px;color:${C.tinta}">${escapeHtml(i)}</li>`)
        .join("")}</ul>`
    : "";
  return titulo + filas + lista;
}

export function plantilla(o: OpcionesPlantilla): string {
  const boton = o.boton
    ? `<p style="margin:30px 0 0"><a href="${escapeHtml(o.boton.url)}" style="display:inline-block;background:${C.acento};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px">${escapeHtml(o.boton.texto)}</a></p>`
    : "";

  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.fondo};font-family:Inter,Arial,Helvetica,sans-serif;color:${C.tinta}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(o.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo};padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${C.linea};border-radius:16px;overflow:hidden">
  <tr><td style="height:4px;background:${C.azul};font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:28px 32px 26px">
    <p style="margin:0;font-size:13px;font-weight:800;letter-spacing:3px;color:${C.azul}">NOMENEX</p>
    <h1 style="margin:18px 0 8px;font-size:22px;line-height:1.3;font-weight:800;color:${C.tinta}">${escapeHtml(o.titulo)}</h1>
    <p style="margin:0;font-size:15px;line-height:1.6;color:${C.gris}">${escapeHtml(o.intro)}</p>
    ${o.secciones.map(seccionHtml).join("")}
    ${boton}
  </td></tr>
  <tr><td style="padding:20px 32px 26px;border-top:1px solid ${C.linea}">
    <p style="margin:0;font-size:12px;line-height:1.6;color:${C.gris}">${escapeHtml(o.nota ?? "Este correo fue generado automáticamente por NOMENEX.")}</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
