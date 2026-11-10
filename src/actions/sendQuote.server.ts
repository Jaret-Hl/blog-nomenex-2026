import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { randomBytes } from "node:crypto";
import { validarSolicitud } from "@/lib/quote/validacion";
import { cotizar } from "@/lib/quote/mapeo";
import { dentroDeLimite } from "@/lib/quote/rateLimit";
import { buildClientEmail, buildInternalEmail, asuntoCliente, asuntoInterno } from "@/lib/quote/emailTemplates";
import { sendMail } from "@/lib/send/sendEmail.server";
import { getEnv } from "@/lib/config/env.server";

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
    if (input.website) return { success: true, folio: null };

    const solicitud = validarSolicitud(
      { ...input.cotizacion, paquete: input.cotizacion.paquete as never },
      input.contacto
    );
    if (!solicitud.ok) {
      throw new ActionError({ code: "BAD_REQUEST", message: solicitud.mensajes[0] ?? "Revisa los datos de tu cotización." });
    }

    const ip = ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
    const correo = solicitud.contacto.correo;
    if (!dentroDeLimite(`ip:${ip}`) || !dentroDeLimite(`correo:${correo}`, 3)) {
      throw new ActionError({
        code: "TOO_MANY_REQUESTS",
        message: "Recibimos varias solicitudes desde tu conexión. Intenta de nuevo en unos minutos.",
      });
    }

    const cotizacion = solicitud.cotizacion;
    const quote = cotizar(cotizacion);
    const folio = generarFolio();
    const datos = { folio, contacto: solicitud.contacto, cotizacion, quote };

    try {
      const env = getEnv();
      // Primero a NOMENEX: el lead nunca se pierde aunque falle el correo al cliente.
      await sendMail({
        to: env.MS_QUOTE_NOTIFY_EMAIL ?? env.MS_USER_EMAIL,
        subject: asuntoInterno(folio, solicitud.contacto.empresa, cotizacion.colaboradores),
        html: buildInternalEmail(datos),
        replyTo: correo,
      });
      await sendMail({ to: correo, subject: asuntoCliente(folio), html: buildClientEmail(datos) });
    } catch (error) {
      console.error("[sendQuote] Error enviando correo:", error);
      throw new ActionError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No pudimos enviar tu cotización. Intenta de nuevo en unos minutos.",
      });
    }

    return { success: true, folio };
  },
});
