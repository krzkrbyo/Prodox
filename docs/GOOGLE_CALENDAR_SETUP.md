# Configuración de Google Calendar Sync (Súper Simple)

## Configuración Ultra Simple con Calendar ID

Esta implementación es **extremadamente simple** - solo necesitas el **ID de tu calendario de Google**. No necesitas API Keys, OAuth, ni configuraciones complejas. La aplicación accede directamente a tu calendario usando el ID.

## Pasos para Obtener tu Calendar ID

1. **Abrir Google Calendar**
   - Ve a [Google Calendar](https://calendar.google.com/) en tu navegador
   - Inicia sesión con tu cuenta de Google

2. **Encontrar el calendario que quieres usar**
   - En el panel izquierdo, encuentra el calendario que quieres sincronizar
   - Si no tienes uno, crea un nuevo calendario

3. **Obtener el Calendar ID**
   - Haz clic en los **3 puntos** (⋮) junto al nombre del calendario
   - Selecciona **"Configuración y uso compartido"**
   - Busca la sección **"ID del calendario"**
   - Copia el ID completo (es muy largo, algo como: `755f4d657f8d98e77b555da649aba70bfee3408e1e70a0070ca0080e43daac31@group.calendar.google.com`)

4. **Hacer el calendario público (IMPORTANTE)**
   - En la misma página de "Configuración y uso compartido"
   - Busca la sección **"Acceso para usuarios con el enlace"**
   - Cambia de "No especificar" a **"Ver todos los detalles del evento"**
   - Haz clic en **"Guardar"**

5. **¡Eso es todo!** Ahora tu calendario es accesible para la sincronización.

## Funcionalidades Implementadas

### ✅ Configuración Ultra Simple
- Solo requiere el Calendar ID de Google Calendar
- Sin API Keys, OAuth, ni configuraciones complejas
- Configuración desde la interfaz de usuario
- Validación automática del Calendar ID

### ✅ Gestión de Calendario
- Usar cualquier calendario existente de Google
- Almacenar calendarId en localStorage y cookies
- Validación automática del Calendar ID al configurar

### ✅ Sincronización Bidireccional
- **Push**: Enviar tareas con `dueDate` a Google Calendar
- **Pull**: Obtener eventos de Google Calendar
- Mapeo por `fbTaskId` para sincronización precisa

### ✅ UI Integrada
- Diálogo súper simple para ingresar Calendar ID
- Instrucciones paso a paso incluidas
- Botones de sincronización
- Estados de carga y feedback visual
- Integración con FullCalendar

## Uso

1. **Conectar con Google**: Haz clic en "Conectar con Google"
2. **Ingresar Calendar ID**: Copia y pega el ID de tu calendario
3. **Sincronizar**:
   - "Pull desde Google": Obtener eventos de Google
   - "Push tareas → Google": Enviar tareas locales a Google

## Reglas de Mapeo

- **Tarea → Evento**: `title`, `description`, `dueDate` → evento all-day
- **Evento → Tarea**: Si tiene `fbTaskId`, actualiza la tarea local
- **Upsert**: Usa `extendedProperties.private.fbTaskId` para identificación

## Cómo Hacer Público tu Calendario

### 📋 **Pasos Detallados:**

1. **Abrir configuración del calendario**
   - Ve a [Google Calendar](https://calendar.google.com/)
   - En el panel izquierdo, encuentra tu calendario
   - Haz clic en los **3 puntos** (⋮) junto al nombre

2. **Acceder a configuración**
   - Selecciona **"Configuración y uso compartido"**
   - Se abrirá una nueva pestaña

3. **Configurar acceso público**
   - Busca la sección **"Acceso para usuarios con el enlace"**
   - Cambia de **"No especificar"** a **"Ver todos los detalles del evento"**
   - Haz clic en **"Guardar"**

4. **Verificar configuración**
   - Deberías ver un mensaje de confirmación
   - El calendario ahora es accesible públicamente

### ⚠️ **Importante:**
- **Solo los eventos serán visibles**, no tu información personal
- **Puedes revertir esto** en cualquier momento
- **Es seguro** para uso con aplicaciones como FocusBoard

## Troubleshooting

- **Calendar ID inválido**: Asegúrate de copiar el ID completo del calendario
- **Calendario no accesible**: El calendario debe ser público (ver pasos arriba)
- **Error de permisos**: Verifica que tengas permisos de escritura en el calendario
- **Revisa los logs**: Si hay errores, revisa la consola del navegador
- **El Calendar ID se almacena**: En cookies del navegador (no en variables de entorno)

## Ventajas de esta Implementación

✅ **Súper fácil**: Solo necesitas copiar y pegar un ID  
✅ **Sin configuración**: No necesitas crear proyectos en Google Cloud  
✅ **Sin API Keys**: No necesitas generar credenciales  
✅ **Sin OAuth**: No necesitas autenticación compleja  
✅ **Para todos**: Cualquier usuario puede usarlo fácilmente  
✅ **Acceso directo**: Usa el Calendar ID directamente sin intermediarios