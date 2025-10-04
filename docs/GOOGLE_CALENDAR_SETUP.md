# Configuración de Google Calendar Sync

## Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

## Pasos para Configurar Google OAuth

1. **Crear un proyecto en Google Cloud Console**
   - Ve a [Google Cloud Console](https://console.developers.google.com/)
   - Crea un nuevo proyecto o selecciona uno existente

2. **Habilitar Google Calendar API**
   - En el menú lateral, ve a "APIs y servicios" > "Biblioteca"
   - Busca "Google Calendar API" y habilítala

3. **Crear credenciales OAuth 2.0**
   - Ve a "APIs y servicios" > "Credenciales"
   - Haz clic en "Crear credenciales" > "ID de cliente OAuth 2.0"
   - Selecciona "Aplicación web"
   - Configura las URIs de redirección autorizadas:
     - `http://localhost:3000/api/auth/callback/google` (desarrollo)
     - `https://tu-dominio.com/api/auth/callback/google` (producción)

4. **Configurar los scopes**
   - Los scopes ya están configurados en el código:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`

5. **Generar NEXTAUTH_SECRET**
   ```bash
   openssl rand -base64 32
   ```

## Funcionalidades Implementadas

### ✅ Autenticación con Google
- Login/logout con NextAuth
- Refresh automático de tokens
- Scopes para Calendar API

### ✅ Gestión de Calendario
- Crear calendario "FocusBoard" automáticamente
- Almacenar calendarId en localStorage y cookies

### ✅ Sincronización Bidireccional
- **Push**: Enviar tareas con `dueDate` a Google Calendar
- **Pull**: Obtener eventos de Google Calendar
- Mapeo por `fbTaskId` para sincronización precisa

### ✅ UI Integrada
- Botones de conexión y sincronización
- Estados de carga y feedback visual
- Integración con FullCalendar

## Uso

1. **Conectar con Google**: Haz clic en "Conectar con Google"
2. **Configurar calendario**: Haz clic en "Usar calendario FocusBoard"
3. **Sincronizar**:
   - "Pull desde Google": Obtener eventos de Google
   - "Push tareas → Google": Enviar tareas locales a Google

## Reglas de Mapeo

- **Tarea → Evento**: `title`, `description`, `dueDate` → evento all-day
- **Evento → Tarea**: Si tiene `fbTaskId`, actualiza la tarea local
- **Upsert**: Usa `extendedProperties.private.fbTaskId` para identificación

## Troubleshooting

- Verifica que las variables de entorno estén configuradas
- Asegúrate de que la Google Calendar API esté habilitada
- Revisa los logs del navegador para errores de autenticación
- Verifica que las URIs de redirección estén configuradas correctamente