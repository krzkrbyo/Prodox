import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getClient, ensureFocusBoardCalendar } from '@/lib/google/googleCalendar';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const client = await getClient(session.accessToken as string, session.refreshToken as string);
    const calendar = await ensureFocusBoardCalendar(client);

    // Guardar calendarId en cookie como fallback
    const response = NextResponse.json({ calendarId: calendar.id });
    response.cookies.set('focusboard_calendar_id', calendar.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });

    return response;
  } catch (error) {
    console.error('Error ensuring calendar:', error);
    return NextResponse.json(
      { error: 'Error al crear o acceder al calendario' },
      { status: 500 }
    );
  }
}
