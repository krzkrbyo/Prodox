import { NextResponse } from "next/server"
import { exchangeCodeForTokens } from "@/lib/google-calendar"

/**
 * Callback de OAuth para Google Calendar
 *
 * Este endpoint maneja el callback de Google después de la autenticación.
 * En producción, deberías:
 * 1. Validar el código de autorización
 * 2. Intercambiar el código por tokens
 * 3. Guardar los tokens de forma segura (base de datos o cookies encriptadas)
 * 4. Redirigir al usuario de vuelta a la aplicación
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    console.error("[Google OAuth] Error:", error)
    return NextResponse.redirect(new URL("/?error=google_auth_failed", request.url))
  }

  if (!code) {
    console.error("[Google OAuth] No se recibió código de autorización")
    return NextResponse.redirect(new URL("/?error=no_code", request.url))
  }

  try {
    // Intercambiar código por tokens
    const tokens = await exchangeCodeForTokens(code)

    console.log("[Google OAuth] Tokens obtenidos exitosamente")

    // En producción, guardarías los tokens de forma segura aquí
    // Por ejemplo, en una base de datos o en cookies encriptadas

    // Redirigir de vuelta a la aplicación con éxito
    return NextResponse.redirect(new URL("/?google_connected=true", request.url))
  } catch (error) {
    console.error("[Google OAuth] Error al intercambiar código:", error)
    return NextResponse.redirect(new URL("/?error=token_exchange_failed", request.url))
  }
}
