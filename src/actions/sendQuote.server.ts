import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { randomBytes } from "node:crypto";
import { validarSolicitud } from "@/lib/quote/validacion";
import { cotizar } from "@/lib/quote/mapeo";
import { enviadoRecientemente, marcarEnviado } from "@/lib/quote/rateLimit";
import { buildClientEmail, buildInternalEmail, asuntoCliente, asuntoInterno } from "@/lib/quote/emailTemplates";
import { sendMail } from "@/lib/send/sendEmail.server";
import { getEnv } from "@/lib/config/env.server";
import { revisarSolicitud } from "@/lib/security/proteccion.server";

const entradaSchema = z.object({
  cotizacion: z.object({
    colaboradores: z.coerce.number(),
    sedes: z.string().max(4),
    paquete: z.string().max(40).nullable(),
    complementos: z.array(z.string().max(40)).max(50),
    equipos: z.coerce.number(),
  }),
  contacto: z.object({
    nombre: z.string().max(300),
    empresa: z.string().max(400),
    correo: z.string().max(320),
    telefono: z.string().max(60),
    privacidad: z.boolean(),
  }),
  website: z.string().max(200).optional().default(""), // campo trampa: debe ir vacío
  captcha: z.string().max(2048).optional().default(""),
});

function generarFolio(): string {
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `NMX-${fecha}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export const sendQuote = defineAction({
  accept: "json",
  input: entradaSchema,
  handler: async (input, ctx) => {
    // Bots: respondemos éxito sin enviar nada.
    if (input.website) return { success: true, folio: null, message: null };

    const solicitud = validarSolicitud(
      { ...input.cotizacion, paquete: input.cotizacion.paquete as never },
      input.contacto
    );
    if (!solicitud.ok) {
      throw new ActionError({ code: "BAD_REQUEST", message: solicitud.mensajes[0] ?? "Revisa los datos de tu cotización." });
    }

    const ip = ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
    const correo = solicitud.contacto.correo;

    const seguridad = await revisarSolicitud({ ip, correo, accion: "cotizacion", captcha: input.captcha });
    if (!seguridad.ok) {
      throw new ActionError({ code: "TOO_MANY_REQUESTS", message: seguridad.mensaje });
    }

    const cotizacion = solicitud.cotizacion;
    const claveDuplicado = `dup:${correo}:${JSON.stringify(cotizacion)}`;
    if (enviadoRecientemente(claveDuplicado)) {
      return {
        success: true,
        folio: null,
        message: "Ya te enviamos esta cotización hace unos minutos. Revisa tu bandeja de entrada.",
      };
    }

    let env;
    try {
      env = getEnv();
    } catch (error) {
      console.error("[sendQuote] Configuración de correo:", error);
      throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "El servicio de correo no está disponible. Intenta más tarde." });
    }

    const quote = cotizar(cotizacion);
    const folio = generarFolio();
    const datos = { folio, contacto: solicitud.contacto, cotizacion, quote };

    // 1) Al cliente: es lo que el cliente espera recibir. Si falla, sí se informa.
    try {
      await sendMail({ to: correo, subject: asuntoCliente(folio), html: buildClientEmail(datos) });
    } catch (error) {
      console.error("[sendQuote] No se pudo enviar al cliente:", error);
      throw new ActionError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No pudimos enviar tu cotización. Intenta de nuevo en unos minutos.",
      });
    }

    // 2) Aviso interno a NOMENEX: si falla, el cliente ya tiene su cotización; solo se registra.
    try {
      await sendMail({
        to: env.MS_QUOTE_NOTIFY_EMAIL ?? env.MS_USER_EMAIL,
        subject: asuntoInterno(folio, solicitud.contacto.empresa, cotizacion.colaboradores),
        html: buildInternalEmail(datos),
        replyTo: correo,
      });
    } catch (error) {
      console.error("[sendQuote] Cotización enviada al cliente, pero falló el aviso interno:", error);
    }

    marcarEnviado(claveDuplicado);
    return { success: true, folio, message: null };
  },
});
