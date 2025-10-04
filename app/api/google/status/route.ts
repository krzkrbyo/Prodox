import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleCalendarStatus } from '@/types/google';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ authenticated: false } as GoogleCalendarStatus);
    }

    // Obtener calendarId del localStorage (simulado con cookie)
    const calendarId = request.cookies.get('focusboard_calendar_id')?.value;

    return NextResponse.json({
      authenticated: true,
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
