import { NextRequest, NextResponse } from 'next/server';
import { validateCalendarId } from '@/lib/google/calendarIdAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received body:', body);
    
    const { calendarId } = body;

    if (!calendarId || typeof calendarId !== 'string' || calendarId.trim() === '') {
      return NextResponse.json(
        { error: 'Calendar ID es requerido y debe ser una cadena válida' },
        { status: 400 }
      );
    }

    console.log('Setting up calendar ID:', calendarId);

    // Simplemente aceptar el Calendar ID sin validación previa
    // La validación real se hará cuando se intente usar
    const trimmedCalendarId = calendarId.trim();
    
    // Guardar calendarId en cookies
    const response = NextResponse.json({ 
      success: true, 
      calendarId: trimmedCalendarId,
      calendarName: 'Calendario de Google',
      message: 'Google Calendar configurado correctamente'
    });
    
    response.cookies.set('google_calendar_id', trimmedCalendarId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });

    return response;
  } catch (error) {
    console.error('Error setting up Google Calendar:', error);
    return NextResponse.json(
      { error: `Error al configurar Google Calendar: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
}
