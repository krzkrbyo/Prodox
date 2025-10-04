import { NextRequest, NextResponse } from 'next/server';
import { listEvents } from '@/lib/google/directCalendar';
import { FocusEvent } from '@/types/google';

export async function POST(request: NextRequest) {
  try {
    const calendarId = request.cookies.get('google_calendar_id')?.value;
    const { timeMin, timeMax } = await request.json();

    if (!calendarId) {
      return NextResponse.json(
        { error: 'No hay Calendar ID configurado' },
        { status: 401 }
      );
    }

    const events = await listEvents(calendarId, timeMin, timeMax);

    return NextResponse.json(events as FocusEvent[]);
  } catch (error) {
    console.error('Error pulling events:', error);
    return NextResponse.json(
      { error: 'Error al obtener eventos del calendario' },
      { status: 500 }
    );
  }
}
