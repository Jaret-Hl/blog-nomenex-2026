import type { ClientData } from '../clientDataManager';

export interface CalendarEvent {
  start: string; // ISO 8601 format
  end: string;   // ISO 8601 format
  title: string;
  description?: string;
  attendees: {
    name: string;
    email: string;
  }[];
}

export class CalendarService {
  /**
   * Crea un evento en el calendario
   */
  static async createEvent(
    event: CalendarEvent
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Aquí iría la integración con tu API de calendario (Google Calendar, Outlook, etc.)
      const response = await fetch('/api/calendar/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear evento en calendario');
      }

      return { success: true };
    } catch (error) {
      console.error('Calendar service error:', error);
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
    return {
      start,
      end,
      title: `Sesión de asesoría - ${client.name}`,
      description: `Sesión agendada con ${client.name} (${client.company || 'Sin empresa'})`,
      attendees: [
        {
          name: client.name,
          email: client.email,
        },
      ],
    };
  }
}
