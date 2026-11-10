// Configuración de correo y Microsoft Graph, validada al primer uso.
import { z } from "astro:schema";

// Quita espacios y saltos de línea que suelen quedar al pegar valores en Vercel.
const limpio = (v: unknown) => (typeof v === "string" ? v.trim() : v);
const vacioAUndefined = (v: unknown) => {
  const t = limpio(v);
  return typeof t === "string" && t === "" ? undefined : t;
};

const esquema = z.object({
  AZURE_TENANT_ID: z.preprocess(limpio, z.string().min(1, "falta AZURE_TENANT_ID")),
  AZURE_CLIENT_ID: z.preprocess(limpio, z.string().min(1, "falta AZURE_CLIENT_ID")),
  AZURE_CLIENT_SECRET: z.preprocess(limpio, z.string().min(1, "falta AZURE_CLIENT_SECRET")),
  MS_USER_EMAIL: z.preprocess(limpio, z.string().email("MS_USER_EMAIL debe ser un correo válido")),
  MS_TIMEZONE: z.preprocess(vacioAUndefined, z.string().default("America/Mexico_City")),
  MS_QUOTE_NOTIFY_EMAIL: z.preprocess(vacioAUndefined, z.string().optional()),
});

export type Env = Omit<z.infer<typeof esquema>, "MS_QUOTE_NOTIFY_EMAIL"> & {
  /** Correo interno que recibe cotizaciones y asesorías. Si es inválido, se usa MS_USER_EMAIL. */
  MS_QUOTE_NOTIFY_EMAIL?: string;
};

const pareceCorreo = (v?: string) => (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : undefined);

let cache: Env | null = null;

export function getEnv(): Env {
  if (cache) return cache;
  // Se leen una por una para que Astro las resuelva en build y en runtime.
  const resultado = esquema.safeParse({
    AZURE_TENANT_ID: import.meta.env.AZURE_TENANT_ID,
    AZURE_CLIENT_ID: import.meta.env.AZURE_CLIENT_ID,
    AZURE_CLIENT_SECRET: import.meta.env.AZURE_CLIENT_SECRET,
    MS_USER_EMAIL: import.meta.env.MS_USER_EMAIL,
    MS_TIMEZONE: import.meta.env.MS_TIMEZONE,
    MS_QUOTE_NOTIFY_EMAIL: import.meta.env.MS_QUOTE_NOTIFY_EMAIL,
  });
  if (!resultado.success) {
    const detalle = resultado.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Configuración de correo incompleta o inválida (${detalle}). Revisa tu archivo .env.`);
  }

  const { MS_QUOTE_NOTIFY_EMAIL, ...resto } = resultado.data;
  const notificar = pareceCorreo(MS_QUOTE_NOTIFY_EMAIL);
  if (MS_QUOTE_NOTIFY_EMAIL && !notificar) {
    console.warn("[env] MS_QUOTE_NOTIFY_EMAIL no es un correo válido; se usará MS_USER_EMAIL.");
  }
  cache = { ...resto, MS_QUOTE_NOTIFY_EMAIL: notificar };
  return cache;
}
