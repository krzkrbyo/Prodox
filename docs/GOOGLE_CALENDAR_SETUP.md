# Configuración de Google Calendar

Esta guía explica cómo configurar la integración con Google Calendar para FocusBoard.

## Estado Actual

Actualmente, la integración con Google Calendar está implementada como **stubs** (funciones simuladas). Esto significa que:

- ✅ La interfaz de usuario está completa y funcional
- ✅ Los flujos de autenticación y sincronización están diseñados
- ⚠️ Las llamadas a la API de Google están simuladas
- ⚠️ Los datos no se sincronizan realmente con Google Calendar

## Implementación Completa

Para implementar la sincronización real con Google Calendar, sigue estos pasos:

### 1. Configurar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Calendar:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Calendar API"
   - Haz clic en "Enable"

### 2. Configurar OAuth 2.0

1. Ve a "APIs & Services" > "Credentials"
2. Haz clic en "Create Credentials" > "OAuth client ID"
3. Selecciona "Web application"
4. Configura:
   - **Authorized JavaScript origins**: `http://localhost:3000` (desarrollo)
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/google/callback`
5. Guarda el **Client ID** y **Client Secret**

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

\`\`\`env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
\`\`\`

### 4. Instalar Dependencias

\`\`\`bash
npm install googleapis
\`\`\`

### 5. Implementar Funciones Reales

Reemplaza las funciones stub en `lib/google-calendar.ts` con implementaciones reales usando la biblioteca `googleapis`:

\`\`\`typescript
import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export async function fetchGoogleCalendarEvents(accessToken: string) {
  oauth2Client.setCredentials({ access_token: accessToken })
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: 'startTime',
  })
  
  return response.data.items || []
}
\`\`\`

### 6. Almacenar Tokens de Forma Segura

Para producción, necesitas almacenar los tokens de acceso y refresh de forma segura:

- **Opción 1**: Base de datos (recomendado para producción)
- **Opción 2**: Cookies encriptadas con `iron-session`
- **Opción 3**: Almacenamiento del lado del servidor

### 7. Manejar Renovación de Tokens

Los tokens de acceso expiran después de 1 hora. Implementa lógica para:

1. Detectar cuando un token ha expirado
2. Usar el refresh token para obtener un nuevo access token
3. Actualizar el token almacenado

### 8. Probar la Integración

1. Inicia la aplicación: `npm run dev`
2. Ve al calendario
3. Haz clic en "Conectar Google"
4. Autoriza la aplicación
5. Prueba crear, editar y eliminar eventos
6. Verifica que se sincronicen con Google Calendar

## Recursos Adicionales

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [googleapis npm package](https://www.npmjs.com/package/googleapis)

## Notas de Seguridad

- ⚠️ **NUNCA** expongas el Client Secret en el código del cliente
- ⚠️ Usa HTTPS en producción
- ⚠️ Valida y sanitiza todos los datos de entrada
- ⚠️ Implementa rate limiting para prevenir abuso
- ⚠️ Revoca tokens cuando el usuario se desconecte
