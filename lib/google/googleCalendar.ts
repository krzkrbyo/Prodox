import { google } from 'googleapis';
import { FocusEvent } from '@/types/google';

export async function getClient(accessToken: string, refreshToken?: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL
  );

  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.calendar({ version: 'v3', auth });
}

export async function ensureFocusBoardCalendar(
  client: any,
  name: string = 'FocusBoard'
): Promise<{ id: string; summary: string }> {
  try {
    // Buscar calendarios existentes
    const calendarList = await client.calendarList.list();
    const existingCalendar = calendarList.data.items?.find(
      (cal: any) => cal.summary === name
    );

    if (existingCalendar) {
      return {
        id: existingCalendar.id,
        summary: existingCalendar.summary,
      };
    }

    // Crear nuevo calendario si no existe
    const newCalendar = await client.calendars.insert({
      requestBody: {
        summary: name,
        description: 'Calendario para sincronización con FocusBoard',
        timeZone: 'America/Mexico_City',
      },
    });

    return {
      id: newCalendar.data.id!,
      summary: newCalendar.data.summary!,
    };
  } catch (error) {
    console.error('Error ensuring FocusBoard calendar:', error);
    throw new Error('No se pudo crear o acceder al calendario FocusBoard');
  }
}

export async function upsertEvent(
  client: any,
  calendarId: string,
  event: FocusEvent
): Promise<{ id: string; created: boolean }> {
  try {
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
  client: any,
  calendarId: string,
  timeMin?: string,
  timeMax?: string
): Promise<FocusEvent[]> {
  try {
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
  client: any,
  calendarId: string,
  eventId: string
): Promise<void> {
  try {
    await client.events.delete({
      calendarId,
      eventId,
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    throw new Error('No se pudo eliminar el evento');
  }
}
