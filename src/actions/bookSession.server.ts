import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { randomBytes } from "node:crypto";
import { ClientDataManager } from "@/lib/clientDataManager";
import { CalendarService } from "@/lib/calendar/calendarService";
import { validarHorario } from "@/lib/calendar/horario";
import { sendMail } from "@/lib/send/sendEmail.server";
import { getEnv } from "@/lib/config/env.server";
import { revisarSolicitud } from "@/lib/security/proteccion.server";
import { validarCotizacion, type CotizacionInput } from "@/lib/quote/validacion";
import { cotizar } from "@/lib/quote/mapeo";
import { generarIcs } from "@/lib/mail/ics";
import {
  buildAsesoriaCliente,
  buildAsesoriaInterno,
  asuntoAsesoriaCliente,
  asuntoAsesoriaInterno,
  type DatosAsesoria,
} from "@/lib/mail/asesoria";

const cotizacionSchema = z
  .object({
    colaboradores: z.coerce.number(),
    sedes: z.string().max(4),
    paquete: z.string().max(40).nullable(),
    complementos: z.array(z.string().max(40)).max(50),
    equipos: z.coerce.number(),
  })
  .optional();

function generarFolio(): string {
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `AS-${fecha}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export const bookSession = defineAction({
  accept: "json",
  input: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
    clientName: z.string().min(2).max(100),
    clientEmail: z.string().email(),
    clientCompany: z.string().optional(),
    clientPhone: z.string().optional(),
    cotizacion: cotizacionSchema, // cotización que el cliente armó en el cotizador (opcional)
  }),
  handler: async (input, ctx) => {
    const env = getEnv();
    const zona = env.MS_TIMEZONE;

    const cliente = ClientDataManager.validate({
      name: input.clientName,
      email: input.clientEmail,
      company: input.clientCompany,
      phone: input.clientPhone,
    });
    if (!cliente.isValid) {
      throw new ActionError({ code: "BAD_REQUEST", message: `Datos inválidos: ${cliente.errors?.join(", ")}` });
    }

    const inicio = new Date(input.start);
    const fin = new Date(input.end);
    const motivo = validarHorario(inicio, fin, zona);
    if (motivo) throw new ActionError({ code: "BAD_REQUEST", message: motivo });

    const ip = ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
    const seguridad = await revisarSolicitud({ ip, correo: cliente.email, accion: "asesoria" });
    if (!seguridad.ok) throw new ActionError({ code: "TOO_MANY_REQUESTS", message: seguridad.mensaje });

    // La cotización se vuelve a validar y recalcular: no se confía en el navegador.
    let cotizacionVerificada: DatosAsesoria["cotizacion"] = null;
    if (input.cotizacion) {
      const v = validarCotizacion(input.cotizacion as CotizacionInput);
      if (v.ok) cotizacionVerificada = { cotizacion: v.valor, quote: cotizar(v.valor) };
    }

    // Evento en Teams SIN invitados: así Microsoft no envía su propia invitación.
    // El cliente recibe un único correo con el enlace, el resumen y el archivo .ics.
    const evento = CalendarService.buildBookingEvent(input.start, input.end, cliente);
    evento.attendees = [];
    const calendario = await CalendarService.createEvent(evento);
    if (!calendario.success) {
      console.error("[bookSession] Error al crear evento:", calendario.error);
      throw new ActionError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No pudimos agendar tu sesión. Intenta de nuevo en unos minutos.",
      });
    }

    const folio = generarFolio();
    const datos: DatosAsesoria = {
      folio,
      inicio,
      fin,
      zona,
      contacto: {
        nombre: cliente.name,
        empresa: cliente.company || undefined,
        correo: cliente.email,
        telefono: cliente.phone || undefined,
      },
      joinUrl: calendario.joinUrl,
      cotizacion: cotizacionVerificada,
    };

    const ics = generarIcs({
      uid: `${folio}@nomenex`,
      inicio: input.start,
      fin: input.end,
      titulo: evento.title,
      descripcion: `Asesoría NOMENEX · Folio ${folio}${calendario.joinUrl ? `\nUnirse: ${calendario.joinUrl}` : ""}`,
      url: calendario.joinUrl,
    });

    try {
      await sendMail({
        to: cliente.email,
        subject: asuntoAsesoriaCliente(datos),
        html: buildAsesoriaCliente(datos),
        adjuntos: [{ nombre: "asesoria-nomenex.ics", tipo: "text/calendar", contenido: Buffer.from(ics).toString("base64") }],
      });
      await sendMail({
        to: env.MS_QUOTE_NOTIFY_EMAIL ?? env.MS_USER_EMAIL,
        subject: asuntoAsesoriaInterno(datos),
        html: buildAsesoriaInterno(datos),
        replyTo: cliente.email,
      });
    } catch (error) {
      // La sesión ya existe en el calendario: no se marca como fallida.
      console.error("[bookSession] Error enviando correos (la sesión sí se creó):", error);
    }

    return {
      success: true,
      folio,
      calendarCreated: true,
      message: "Sesión agendada y agregada al calendario. Revisa tu correo para la confirmación.",
    };
  },
});
