import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getClient, deleteEvent } from '@/lib/google/googleCalendar';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { calendarId, eventId } = await request.json();

    if (!calendarId || !eventId) {
      return NextResponse.json(
        { error: 'calendarId y eventId son requeridos' },
        { status: 400 }
      );
    }

    const client = await getClient(session.accessToken as string, session.refreshToken as string);
    await deleteEvent(client, calendarId, eventId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el evento' },
      { status: 500 }
    );
  }
}
