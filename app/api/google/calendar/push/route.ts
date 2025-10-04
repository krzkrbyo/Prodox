import { NextRequest, NextResponse } from 'next/server';
import { upsertEvent } from '@/lib/google/directCalendar';
import { FocusEvent, CalendarOperationResult } from '@/types/google';

export async function POST(request: NextRequest) {
  try {
    const calendarId = request.cookies.get('google_calendar_id')?.value;
    const { events } = await request.json();

    if (!calendarId) {
      return NextResponse.json(
        { error: 'No hay Calendar ID configurado' },
        { status: 401 }
      );
    }

    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: 'events es requerido y debe ser un array' },
        { status: 400 }
      );
    }
    
    const result: CalendarOperationResult = {
      created: 0,
      updated: 0,
      unchanged: 0,
    };

    for (const event of events as FocusEvent[]) {
      try {
        const { created } = await upsertEvent(calendarId, event);
        if (created) {
          result.created++;
        } else {
          result.updated++;
        }
      } catch (error) {
        console.error('Error upserting event:', error);
        result.unchanged++;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error pushing events:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar eventos con el calendario' },
      { status: 500 }
    );
  }
}
