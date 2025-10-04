import { FocusEvent } from '@/types/google';

// Función para hacer requests directos a la API de Google Calendar
async function makeCalendarRequest(calendarId: string, endpoint: string, method: string = 'GET', body?: any) {
  const baseUrl = 'https://www.googleapis.com/calendar/v3';
  const url = `${baseUrl}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Calendar API request failed:', error);
    throw error;
  }
}

export async function listEvents(
  calendarId: string,
  timeMin?: string,
  timeMax?: string
): Promise<FocusEvent[]> {
  try {
    console.log('Listing events for calendar:', calendarId);
    
    const params = new URLSearchParams({
      calendarId,
      singleEvents: 'true',
      orderBy: 'startTime',
    });
    
    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);
    
    const data = await makeCalendarRequest(calendarId, `/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
    
    return data.items?.map((event: any) => ({
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
    throw new Error('No se pudieron obtener los eventos del calendario. Verifica que el Calendar ID sea correcto y que el calendario sea accesible.');
  }
}

export async function upsertEvent(
  calendarId: string,
  event: FocusEvent
): Promise<{ id: string; created: boolean }> {
  try {
    console.log('Upserting event:', event);
    
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
      const data = await makeCalendarRequest(
        calendarId, 
        `/calendars/${encodeURIComponent(calendarId)}/events/${event.id}`,
        'PUT',
        eventData
      );
      return { id: data.id!, created: false };
    } else {
      // Crear nuevo evento
      const data = await makeCalendarRequest(
        calendarId,
        `/calendars/${encodeURIComponent(calendarId)}/events`,
        'POST',
        eventData
      );
      return { id: data.id!, created: true };
    }
  } catch (error) {
    console.error('Error upserting event:', error);
    throw new Error('No se pudo crear o actualizar el evento. Verifica que tengas permisos de escritura en el calendario.');
  }
}

export async function deleteEvent(
  calendarId: string,
  eventId: string
): Promise<void> {
  try {
    console.log('Deleting event:', eventId);
    
    await makeCalendarRequest(
      calendarId,
      `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      'DELETE'
    );
  } catch (error) {
    console.error('Error deleting event:', error);
    throw new Error('No se pudo eliminar el evento. Verifica que tengas permisos de escritura en el calendario.');
  }
}
