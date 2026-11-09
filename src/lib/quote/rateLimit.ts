// Límite simple por clave (IP o correo). Vive en memoria del proceso: en serverless cada instancia lleva la suya.
const ventanas = new Map<string, number[]>();

export function dentroDeLimite(clave: string, max = 5, ventanaMs = 15 * 60 * 1000): boolean {
  const ahora = Date.now();
  const recientes = (ventanas.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
  if (recientes.length >= max) {
    ventanas.set(clave, recientes);
    return false;
  }
  recientes.push(ahora);
  ventanas.set(clave, recientes);
  if (ventanas.size > 5000) ventanas.clear(); // evita crecimiento sin control
  return true;
}
