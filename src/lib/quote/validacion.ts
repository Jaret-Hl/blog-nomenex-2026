// Validaciones compartidas por el formulario (navegador) y la acción de servidor.
import { PRECIOS, type PaqueteId } from "@/config/precios";

export const SEDES_OPCIONES = ["1", "2", "3", "4", "6"] as const;
export const MAX_COLABORADORES = 1000;   // tope de captura; por encima de 200 es cotización a la medida
export const MAX_EQUIPOS = 100;

export interface CotizacionInput {
  colaboradores: number;
  sedes: string;
  paquete: PaqueteId | null;
  complementos: string[];
  equipos: number;
}

export interface ContactoInput {
  nombre: string;
  empresa: string;
  correo: string;
  telefono: string;
  privacidad: boolean;
}

export type ErroresContacto = Partial<Record<keyof ContactoInput, string>>;

/** Quita caracteres de control y espacios repetidos. */
export function limpiarTexto(valor: unknown): string {
  if (typeof valor !== "string") return "";
  return valor.replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
}

const CORREO = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const NOMBRE = /^[\p{L}][\p{L}\s.'-]*$/u;

export function validarCorreo(valor: string): string | null {
  if (!valor) return "Escribe tu correo electrónico.";
  if (valor.length > 254 || !CORREO.test(valor)) return "Revisa tu correo electrónico.";
  return null;
}

export function validarTelefono(valor: string): string | null {
  if (!valor) return null; // opcional
  let digitos = valor.replace(/[\s()\-+.]/g, "");
  if (digitos.length === 12 && digitos.startsWith("52")) digitos = digitos.slice(2);
  return /^\d{10}$/.test(digitos) ? null : "El teléfono debe tener 10 dígitos.";
}

export function validarContacto(entrada: Partial<ContactoInput>): {
  ok: boolean;
  errores: ErroresContacto;
  valor: ContactoInput;
} {
  const valor: ContactoInput = {
    nombre: limpiarTexto(entrada.nombre),
    empresa: limpiarTexto(entrada.empresa),
    correo: limpiarTexto(entrada.correo).toLowerCase(),
    telefono: limpiarTexto(entrada.telefono),
    privacidad: entrada.privacidad === true,
  };
  const errores: ErroresContacto = {};

  if (valor.nombre.length < 2) errores.nombre = "Escribe tu nombre completo.";
  else if (valor.nombre.length > 100 || !NOMBRE.test(valor.nombre)) errores.nombre = "Revisa tu nombre.";

  if (valor.empresa.length < 2) errores.empresa = "Escribe el nombre de tu empresa.";
  else if (valor.empresa.length > 150) errores.empresa = "El nombre de la empresa es demasiado largo.";

  const errCorreo = validarCorreo(valor.correo);
  if (errCorreo) errores.correo = errCorreo;

  const errTel = validarTelefono(valor.telefono);
  if (errTel) errores.telefono = errTel;

  if (!valor.privacidad) errores.privacidad = "Acepta el aviso de privacidad para continuar.";

  return { ok: Object.keys(errores).length === 0, errores, valor };
}

export function validarCotizacion(entrada: CotizacionInput): {
  ok: boolean;
  errores: string[];
  valor: CotizacionInput;
} {
  const errores: string[] = [];
  const colaboradores = Math.floor(Number(entrada.colaboradores));
  if (!Number.isFinite(colaboradores) || colaboradores < 1 || colaboradores > MAX_COLABORADORES) {
    errores.push(`El número de colaboradores debe estar entre 1 y ${MAX_COLABORADORES}.`);
  }

  const sedes = String(entrada.sedes);
  if (!(SEDES_OPCIONES as readonly string[]).includes(sedes)) errores.push("Selecciona el número de sedes.");

  const paquete = entrada.paquete;
  if (!paquete || !(paquete in PRECIOS.paquetes)) errores.push("Elige un paquete.");

  const idsValidos = new Set(PRECIOS.complementos.map((c) => c.id));
  const complementos = [...new Set(entrada.complementos ?? [])].filter((id) => idsValidos.has(id));

  let equipos = 1;
  if (complementos.includes("bio")) {
    equipos = Math.floor(Number(entrada.equipos));
    if (!Number.isFinite(equipos) || equipos < 1 || equipos > MAX_EQUIPOS) {
      errores.push(`Los biométricos deben ser entre 1 y ${MAX_EQUIPOS} equipos.`);
    }
  }

  return {
    ok: errores.length === 0,
    errores,
    valor: { colaboradores, sedes, paquete: paquete ?? null, complementos, equipos },
  };
}

/** Valida la solicitud completa tal como llega al servidor. */
export function validarSolicitud(cotizacion: CotizacionInput, contacto: Partial<ContactoInput>) {
  const c = validarCotizacion(cotizacion);
  const k = validarContacto(contacto);
  return {
    ok: c.ok && k.ok,
    mensajes: [...c.errores, ...Object.values(k.errores)] as string[],
    cotizacion: c.valor,
    contacto: k.valor,
  };
}
