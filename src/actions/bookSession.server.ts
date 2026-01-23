import { sendMail } from '@/lib/send/sendEmail.server';
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { ClientDataManager } from '@/lib/clientDataManager';
import { CalendarService } from '@/lib/calendar/calendarService';


export const bookSession = defineAction({
  accept: 'json',
  input: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
    clientName: z.string().min(2).max(100),
    clientEmail: z.string().email(),
    clientCompany: z.string().optional(),
    clientPhone: z.string().optional(),
  }),
  handler: async ({ start, end, clientName, clientEmail, clientCompany, clientPhone }) => {
    // Validar y sanitizar datos del cliente
    const validatedClient = ClientDataManager.validate({
      name: clientName,
      email: clientEmail,
      company: clientCompany,
      phone: clientPhone,
    });

    if (!validatedClient.isValid) {
      throw new Error(`Datos inválidos: ${validatedClient.errors?.join(', ')}`);
    }

    try {
      // 1. Crear evento en calendario
      const event = CalendarService.buildBookingEvent(
        start,
        end,
        validatedClient
      );
      
// En bookSession.ts, después de crear el evento
const calendarResult = await CalendarService.createEvent(event);

if (!calendarResult.success) {
  console.error('Error al crear evento:', calendarResult.error);
  // Continuar con el proceso aunque falle el calendario
}

// 2. Enviar correo de confirmación
await sendMail({
  to: validatedClient.email,
  subject: 'Sesión confirmada - Nomenex',
  html: `
    <h2>Hola ${validatedClient.name}</h2>
    <p>Tu sesión ha sido agendada exitosamente.</p>
    
    <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">📋 Detalles de tu sesión</h3>
      
      <p><strong>👤 Nombre:</strong> ${validatedClient.name}</p>
      ${validatedClient.company ? `<p><strong>🏢 Empresa:</strong> ${validatedClient.company}</p>` : ''}
      <p><strong>📧 Email:</strong> ${validatedClient.email}</p>
      ${validatedClient.phone ? `<p><strong>📱 Teléfono:</strong> ${validatedClient.phone}</p>` : ''}
      
      <hr style="border: none; border-top: 1px solid #d1d5db; margin: 16px 0;">
      
      <p><strong>📅 Fecha y hora:</strong></p>
      <p style="font-size: 16px; margin: 8px 0;">${new Date(start).toLocaleString('es-MX', { 
        timeZone: import.meta.env.MS_TIMEZONE,
        dateStyle: 'full',
        timeStyle: 'short'
      })}</p>
      
      <p><strong>⏱️ Duración:</strong> ${calculateDuration(start, end)} minutos</p>
      
      ${calendarResult.joinUrl ? `
        <p style="margin-top: 16px;">
          <a href="${calendarResult.joinUrl}" 
             style="background: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            🎥 Unirse a la reunión de Teams
          </a>
        </p>
      ` : ''}
    </div>

    <p>Recibirás un recordatorio 24 horas antes de tu sesión.</p>
    
    <p style="color: #666; font-size: 12px; margin-top: 20px;">
      Zona horaria: ${import.meta.env.MS_TIMEZONE}
    </p>
  `,
});

      return {
        success: true,
        calendarCreated: calendarResult.success,
        message: calendarResult.success
          ? 'Sesión agendada y agregada al calendario'
          : 'Sesión agendada (evento de calendario pendiente)',
      };
    } catch (error) {
      console.error('Booking error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Error al procesar la reserva'
      );
    }
  },
});

function calculateDuration(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.round((endDate.getTime() - startDate.getTime()) / 60000);
}
