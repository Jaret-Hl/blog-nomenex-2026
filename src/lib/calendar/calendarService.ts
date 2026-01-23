// src/lib/calendar/calendarService.ts
import type { ClientData } from '../clientDataManager';
import { getMicrosoftToken } from '../microsoftAuth.server';

export interface CalendarEvent {
  start: string; // ISO 8601 format
  end: string;   // ISO 8601 format
  title: string;
  description?: string;
  attendees: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
  }[];
}

export class CalendarService {
  /**
   * Crea un evento en el calendario
   */
  static async createEvent(
    event: CalendarEvent
  ): Promise<{ success: boolean; error?: string; eventId?: string; joinUrl?: string }> {
    try {

      // Obtener token de Microsoft Graph
      const token = await getMicrosoftToken();
      const userEmail = import.meta.env.MS_USER_EMAIL;
      const timezone = import.meta.env.MS_TIMEZONE || 'America/Mexico_City';

      if (!userEmail) {
        throw new Error('MS_USER_EMAIL no está configurado');
      }

      // Preparar datos del evento para Microsoft Graph
      const eventData = {
        subject: event.title,
        body: {
          contentType: 'HTML',
          content: event.description || '',
        },
        start: {
          dateTime: event.start,
          timeZone: timezone,
        },
        end: {
          dateTime: event.end,
          timeZone: timezone,
        },
        isOnlineMeeting: true,
        onlineMeetingProvider: 'teamsForBusiness',
        attendees: event.attendees.map((attendee) => ({
          emailAddress: {
            address: attendee.email,
            name: attendee.name,
          },
          type: 'required',
        })),
      };

      // Crear evento directamente en Microsoft Graph
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/users/${userEmail}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = responseText;
        }
        console.error('❌ Error de Microsoft Graph:', errorData);
        throw new Error(
          errorData?.error?.message || 'Error al crear evento en calendario'
        );
      }

      const eventResult = JSON.parse(responseText);

      return {
        success: true,
        eventId: eventResult.id,
        joinUrl: eventResult.onlineMeeting?.joinUrl,
      };
    } catch (error) {
      console.error('❌ Calendar service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Construye un objeto de evento desde datos de sesión
   */
  static buildBookingEvent(
    start: string,
    end: string,
    client: ClientData
  ): CalendarEvent {
    // Construir lista de datos del cliente
    const clientDetails = [
      `<p><strong>Cliente:</strong> ${client.name}</p>`,
      `<p><strong>Email:</strong> ${client.email}</p>`,
      client.company ? `<p><strong>Empresa:</strong> ${client.company}</p>` : '',
      client.phone ? `<p><strong>Teléfono:</strong> ${client.phone}</p>` : '',
    ].filter(Boolean).join('\n');

    return {
      start,
      end,
      title: `Sesión de asesoría - ${client.name}${client.company ? ` (${client.company})` : ''}`,
      description: `
        <h2>Sesión de asesoría agendada</h2>
        ${clientDetails}
        <hr>
        <p><em>Esta sesión fue agendada a través del sistema de cotizaciones.</em></p>
      `,
      attendees: [
        {
          name: client.name,
          email: client.email,
          company: client.company,
          phone: client.phone,
        },
      ],
    };
  }
}