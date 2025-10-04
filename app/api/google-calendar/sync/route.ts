import { NextResponse } from "next/server"
import { fetchGoogleCalendarEvents, convertGoogleEventToInternal } from "@/lib/google-calendar"

/**
 * Endpoint para sincronizar eventos de Google Calendar
 *
 * Este endpoint obtiene eventos de Google Calendar y los devuelve en formato interno.
 * En producción, deberías:
 * 1. Validar que el usuario esté autenticado
 * 2. Obtener el access token del usuario desde la base de datos o cookies
 * 3. Manejar la renovación de tokens si es necesario
 * 4. Implementar paginación para grandes cantidades de eventos
 */
export async function GET(request: Request) {
  try {
    // En producción, obtendrías el access token del usuario autenticado
    const accessToken = "mock_access_token"

    console.log("[Sync API] Iniciando sincronización con Google Calendar...")

    // Obtener eventos de Google Calendar
    const googleEvents = await fetchGoogleCalendarEvents(accessToken)

    // Convertir eventos al formato interno
    const internalEvents = googleEvents.map(convertGoogleEventToInternal)

    console.log("[Sync API] Sincronización completada:", internalEvents.length, "eventos")

    return NextResponse.json({
      success: true,
      events: internalEvents,
      syncedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Sync API] Error al sincronizar:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al sincronizar con Google Calendar",
      },
      { status: 500 },
    )
  }
}

/**
 * Endpoint para enviar eventos locales a Google Calendar
 */
export async function POST(request: Request) {
  try {
    const { events } = await request.json()

    console.log("[Sync API] Enviando eventos a Google Calendar:", events.length)

    // En producción, crearías/actualizarías cada evento en Google Calendar
    // usando createGoogleCalendarEvent o updateGoogleCalendarEvent

    return NextResponse.json({
      success: true,
      syncedCount: events.length,
      syncedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Sync API] Error al enviar eventos:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al enviar eventos a Google Calendar",
      },
      { status: 500 },
    )
  }
}
