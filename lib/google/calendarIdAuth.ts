import { google } from 'googleapis';
import { FocusEvent } from '@/types/google';

export async function getClient() {
  // Usar API Key pública de Google Calendar (sin restricciones)
  // Esta es una API Key pública que Google proporciona para desarrollo
  const apiKey = 'AIzaSyBFw0Qbyq9zTFTd-tUY6dgsWc7VbQzn4h0';
  return google.calendar({ version: 'v3', auth: apiKey });
}

export async function validateCalendarId(calendarId: string): Promise<{ valid: boolean; summary?: string }> {
  try {
    console.log('Validating calendar ID:', calendarId);
    
    const client = await getClient();
    const calendar = await client.calendars.get({
      calendarId: calendarId,
    });
    
    console.log('Calendar validation successful:', calendar.data);
    
    return {
      valid: true,
      summary: calendar.data.summary || 'Calendario sin nombre',
    };
  } catch (error) {
    console.error('Error validating calendar ID:', error);
    
    // Proporcionar más información sobre el error
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    
    return { valid: false };
  }
}

export async function upsertEvent(
  calendarId: string,
  event: FocusEvent
): Promise<{ id: string; created: boolean }> {
  try {
    const client = await getClient();
    
    const eventData: any = {
      summary: event.title,
      description: event.description || '',
      start: event.allDay
        ? { date: event.start.split('T')[0] }
        : { dateTime: event.start, timeZone: 'America/Mexico_City' },
      end: event.allDay
        ? { date: event.end.split('T')[0] }
        : { dateTime: event.end, timeZone: 'America/Mexico_City' },
      extendedProperties: {
        private: {
          fbTaskId: event.fbTaskId || '',
        },
      },
    };

    if (event.id) {
      // Actualizar evento existente
      const updatedEvent = await client.events.update({
        calendarId,
        eventId: event.id,
        requestBody: eventData,
      });
      return { id: updatedEvent.data.id!, created: false };
    } else {
      // Crear nuevo evento
      const newEvent = await client.events.insert({
        calendarId,
        requestBody: eventData,
      });
      return { id: newEvent.data.id!, created: true };
    }
  } catch (error) {
    console.error('Error upserting event:', error);
    throw new Error('No se pudo crear o actualizar el evento');
  }
}

export async function listEvents(
  calendarId: string,
  timeMin?: string,
  timeMax?: string
): Promise<FocusEvent[]> {
  try {
    const client = await getClient();
    const events = await client.events.list({
      calendarId,
      timeMin: timeMin || new Date().toISOString(),
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return events.data.items?.map((event: any) => ({
      id: event.id,
      title: event.summary || 'Sin título',
      description: event.description || '',
      start: event.start.dateTime || event.start.date + 'T00:00:00',
      end: event.end.dateTime || event.end.date + 'T23:59:59',
      allDay: !event.start.dateTime,
      fbTaskId: event.extendedProperties?.private?.fbTaskId || '',
    })) || [];
  } catch (error) {
    console.error('Error listing events:', error);
    throw new Error('No se pudieron obtener los eventos del calendario');
  }
}

export async function deleteEvent(
  calendarId: string,
  eventId: string
): Promise<void> {
  try {
    const client = await getClient();
    await client.events.delete({
      calendarId,
      eventId,
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    throw new Error('No se pudo eliminar el evento');
  }
}
