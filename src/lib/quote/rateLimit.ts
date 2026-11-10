// Límites de uso en memoria del proceso. En serverless cada instancia lleva su propio conteo;
// para un control estricto conviene migrar a un almacén compartido (Redis, Turso, Vercel KV).
const HORA = 3_600_000;
const DIA = 24 * HORA;
const ventanas = new Map<string, number[]>();
const enviados = new Map<string, number>();

function pruneDe(mapa: Map<string, unknown>, limite: number) {
  if (mapa.size > limite) mapa.clear();
}

/** Cuenta un intento si está dentro del límite de la ventana. */
export function dentroDeLimite(clave: string, max = 5, ventanaMs = 15 * 60 * 1000): boolean {
  const ahora = Date.now();
  const recientes = (ventanas.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
  if (recientes.length >= max) {
    ventanas.set(clave, recientes);
    return false;
  }
  recientes.push(ahora);
  ventanas.set(clave, recientes);
  pruneDe(ventanas, 10_000);
  return true;
}

/** Tope global de correos por día (protege la cuota de Microsoft 365). */
export function contarGlobal(max: number): boolean {
  return dentroDeLimite("global:dia", max, DIA);
}

/** ¿Se envió ya algo igual en los últimos minutos? */
export function enviadoRecientemente(clave: string, ventanaMs = 30 * 60 * 1000): boolean {
  const ultimo = enviados.get(clave);
  return ultimo !== undefined && Date.now() - ultimo < ventanaMs;
}

export function marcarEnviado(clave: string) {
  enviados.set(clave, Date.now());
  pruneDe(enviados, 10_000);
}
