// Configuración de correo y Microsoft Graph, validada al primer uso.
import { z } from "astro:schema";

const vacioAUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const esquema = z.object({
  AZURE_TENANT_ID: z.string().min(1, "falta AZURE_TENANT_ID"),
  AZURE_CLIENT_ID: z.string().min(1, "falta AZURE_CLIENT_ID"),
  AZURE_CLIENT_SECRET: z.string().min(1, "falta AZURE_CLIENT_SECRET"),
  MS_USER_EMAIL: z.string().email("MS_USER_EMAIL debe ser un correo válido"),
  MS_TIMEZONE: z.preprocess(vacioAUndefined, z.string().default("America/Mexico_City")),
  MS_QUOTE_NOTIFY_EMAIL: z.preprocess(
    vacioAUndefined,
    z.string().email("MS_QUOTE_NOTIFY_EMAIL debe ser un correo válido").optional()
  ),
});

export type Env = z.infer<typeof esquema>;

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
  cache = resultado.data;
  return cache;
}
