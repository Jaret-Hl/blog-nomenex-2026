// Validaciones compartidas por el formulario (navegador) y la acción de servidor.
import { PRECIOS, type PaqueteId, type Periodo, type Salarios } from "@/config/precios";

export const MAX_COLABORADORES = 1000; // captura; por encima de 200 es cotización a la medida
export const MAX_EQUIPOS = 100;
export const RANGOS = { razones: [1, 50], registros: [1, 50], nominas: [1, 20], asimilados: [0, 20] } as const;
export const PERIODOS = Object.keys(PRECIOS.periodicidad) as Periodo[];
export const SALARIOS_OPC = Object.keys(PRECIOS.salarios) as Salarios[];

export interface CotizacionInput {
  colaboradores: number;
  razones: number;
  registros: number;
  salarios: Salarios;
  nominas: number;
  periodo: Periodo;
  asimilados: number;
  periodoAsim: Periodo;
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

export function limpiarTexto(valor: unknown): string {
  if (typeof valor !== "string") return "";
  return valor.replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
}

const CORREO = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const NOMBRE = /^[\p{L}][\p{L}\s.'-]*$/u;
const enRango = (v: number, [min, max]: readonly number[]) => Number.isInteger(v) && v >= min && v <= max;

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

export function validarContacto(entrada: Partial<ContactoInput>) {
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

export function validarCotizacion(e: CotizacionInput) {
  const errores: string[] = [];
  const colaboradores = Math.floor(Number(e.colaboradores));
  if (!enRango(colaboradores, [1, MAX_COLABORADORES])) errores.push(`El número de colaboradores debe estar entre 1 y ${MAX_COLABORADORES}.`);
  if (!enRango(Number(e.razones), RANGOS.razones)) errores.push("Revisa el número de razones sociales.");
  if (!enRango(Number(e.registros), RANGOS.registros)) errores.push("Revisa el número de registros patronales.");
  if (!enRango(Number(e.nominas), RANGOS.nominas)) errores.push("Revisa el número de nóminas.");
  if (!enRango(Number(e.asimilados), RANGOS.asimilados)) errores.push("Revisa el número de nóminas de asimilados.");
  if (!SALARIOS_OPC.includes(e.salarios)) errores.push("Selecciona el tipo de salario.");
  if (!PERIODOS.includes(e.periodo) || !PERIODOS.includes(e.periodoAsim)) errores.push("Selecciona la periodicidad.");
  if (!e.paquete || !(e.paquete in PRECIOS.paquetes)) errores.push("Elige un paquete.");

  const ids = new Set(PRECIOS.complementos.map((c) => c.id));
  const complementos = [...new Set(e.complementos ?? [])].filter((id) => ids.has(id));
  let equipos = 1;
  if (complementos.includes("bio")) {
    equipos = Math.floor(Number(e.equipos));
    if (!enRango(equipos, [1, MAX_EQUIPOS])) errores.push(`Los biométricos deben ser entre 1 y ${MAX_EQUIPOS} equipos.`);
  }

  return {
    ok: errores.length === 0,
    errores,
    valor: { ...e, colaboradores, complementos, equipos, paquete: e.paquete ?? null } as CotizacionInput,
  };
}

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
