// Revisión previa a cualquier envío de correo: captcha, correos desechables, límites y tope diario.
import { dentroDeLimite, contarGlobal } from "@/lib/quote/rateLimit";
import { DOMINIOS_DESECHABLES } from "./dominios";
import { verificarTurnstile } from "./turnstile.server";

export type Accion = "cotizacion" | "asesoria";

export interface ResultadoProteccion {
  ok: boolean;
  mensaje?: string;
}

const DIA = 86_400_000;
const HORA = 3_600_000;
const fallo = (mensaje: string): ResultadoProteccion => ({ ok: false, mensaje });

function topeDiario(): number {
  const valor = Number(import.meta.env.MAX_CORREOS_DIA);
  return Number.isFinite(valor) && valor > 0 ? valor : 300;
}

export async function revisarSolicitud(o: {
  ip: string;
  correo: string;
  accion: Accion;
  captcha?: string | null;
}): Promise<ResultadoProteccion> {
  const dominio = o.correo.split("@")[1]?.toLowerCase() ?? "";
  if (DOMINIOS_DESECHABLES.has(dominio)) {
    return fallo("Usa un correo personal o corporativo para recibir tu cotización.");
  }

  if (o.accion === "cotizacion") {
    const humano = await verificarTurnstile(o.captcha, o.ip);
    if (humano === false) return fallo("No pudimos confirmar que eres una persona. Recarga la página e intenta de nuevo.");
  }

  const conexion = "Recibimos varias solicitudes desde tu conexión. Intenta más tarde.";
  const correo = "Este correo ya recibió varias solicitudes hoy. Intenta mañana.";

  const reglas: Array<[string, number, number, string]> =
    o.accion === "cotizacion"
      ? [
          [`ip:${o.ip}:cot:15m`, 5, 15 * 60_000, conexion],
          [`ip:${o.ip}:cot:dia`, 25, DIA, conexion],
          [`mail:${o.correo}:cot:dia`, 3, DIA, correo],
        ]
      : [
          [`ip:${o.ip}:ase:hora`, 4, HORA, conexion],
          [`mail:${o.correo}:ase:dia`, 2, DIA, correo],
        ];

  for (const [clave, max, ventana, mensaje] of reglas) {
    if (!dentroDeLimite(clave, max, ventana)) return fallo(mensaje);
  }

  if (!contarGlobal(topeDiario())) {
    return fallo("Estamos atendiendo muchas solicitudes hoy. Intenta más tarde.");
  }

  return { ok: true };
}
