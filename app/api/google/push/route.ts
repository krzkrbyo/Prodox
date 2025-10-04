import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getClient, upsertEvent } from '@/lib/google/googleCalendar';
import { FocusEvent, CalendarOperationResult } from '@/types/google';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { calendarId, events } = await request.json();

    if (!calendarId || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'calendarId y events son requeridos' },
        { status: 400 }
      );
    }

    const client = await getClient(session.accessToken as string, session.refreshToken as string);
    
    const result: CalendarOperationResult = {
      created: 0,
      updated: 0,
      unchanged: 0,
    };

    for (const event of events as FocusEvent[]) {
      try {
        const { created } = await upsertEvent(client, calendarId, event);
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
