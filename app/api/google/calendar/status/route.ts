import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarStatus } from '@/types/google';

export async function GET(request: NextRequest) {
  try {
    // Obtener calendarId del localStorage (simulado con cookie)
    const calendarId = request.cookies.get('google_calendar_id')?.value;

    return NextResponse.json({
      authenticated: !!calendarId,
      calendarId: calendarId || undefined,
    } as GoogleCalendarStatus);
  } catch (error) {
    console.error('Error checking Google status:', error);
    return NextResponse.json(
      { error: 'Error al verificar el estado de Google' },
      { status: 500 }
    );
  }
}
