import { NextRequest, NextResponse } from 'next/server';
import { deleteEvent } from '@/lib/google/directCalendar';

export async function DELETE(request: NextRequest) {
  try {
    const calendarId = request.cookies.get('google_calendar_id')?.value;
    const { eventId } = await request.json();

    if (!calendarId) {
      return NextResponse.json(
        { error: 'No hay Calendar ID configurado' },
        { status: 401 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId es requerido' },
        { status: 400 }
      );
    }

    await deleteEvent(calendarId, eventId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el evento' },
      { status: 500 }
    );
  }
}
