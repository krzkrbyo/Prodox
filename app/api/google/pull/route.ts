import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getClient, listEvents } from '@/lib/google/googleCalendar';
import { FocusEvent } from '@/types/google';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { calendarId, timeMin, timeMax } = await request.json();

    if (!calendarId) {
      return NextResponse.json(
        { error: 'calendarId es requerido' },
        { status: 400 }
      );
    }

    const client = await getClient(session.accessToken as string, session.refreshToken as string);
    const events = await listEvents(client, calendarId, timeMin, timeMax);

    return NextResponse.json(events as FocusEvent[]);
  } catch (error) {
    console.error('Error pulling events:', error);
    return NextResponse.json(
      { error: 'Error al obtener eventos del calendario' },
      { status: 500 }
    );
  }
}
