"use client"

import { useState, useEffect } from "react"
import "./calendar.css"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { DateSelectArg, EventClickArg, EventInput } from "@fullcalendar/core"
import esLocale from "@fullcalendar/core/locales/es"
import { useCalendarStore } from "@/lib/stores/useCalendarStore"
import { useTaskStore } from "@/lib/stores/useTaskStore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Cloud, CloudOff, Download, Upload, Key, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { CalendarEvent } from "@/types/calendar"
import type { FocusEvent, GoogleCalendarStatus } from "@/types/google"

export function CalendarPanel() {
  const { events, addEvent, updateEvent, deleteEvent } = useCalendarStore()
  const { tasks, updateTask } = useTaskStore()

  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [googleStatus, setGoogleStatus] = useState<GoogleCalendarStatus>({ authenticated: false })
  const [googleEvents, setGoogleEvents] = useState<FocusEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false)
  const [calendarId, setCalendarId] = useState("")
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false)

  // Form state
  const [eventTitle, setEventTitle] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventAllDay, setEventAllDay] = useState(true)
  const [eventStartTime, setEventStartTime] = useState("09:00")
  const [eventEndTime, setEventEndTime] = useState("10:00")
  const [linkedTaskId, setLinkedTaskId] = useState<string>("")

  // Verificar estado de Google al cargar
  useEffect(() => {
    checkGoogleStatus()
  }, [])

  const checkGoogleStatus = async () => {
    try {
      const response = await fetch('/api/google/calendar/status')
      const status = await response.json()
      setGoogleStatus(status)
      
      // Guardar calendarId en localStorage si existe
      if (status.calendarId) {
        localStorage.setItem('google_calendar_id', status.calendarId)
      }
    } catch (error) {
      console.error('Error checking Google status:', error)
    }
  }

  const setupGoogleCalendar = async () => {
    if (!calendarId.trim()) {
      toast.error('Por favor ingresa el ID de tu calendario de Google')
      return
    }

    setIsLoading(true)
    try {
      console.log('Sending calendar ID:', calendarId.trim())
      
      const response = await fetch('/api/google/calendar/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId: calendarId.trim() }),
      })
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Response data:', data)
        
        localStorage.setItem('google_calendar_id', data.calendarId)
        setGoogleStatus({ authenticated: true, calendarId: data.calendarId })
        setIsSetupDialogOpen(false)
        setCalendarId("")
        toast.success(`Google Calendar "${data.calendarName}" configurado correctamente`)
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Setup error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al configurar calendario')
    } finally {
      setIsLoading(false)
    }
  }

  const pullFromGoogle = async () => {
    const calendarId = localStorage.getItem('google_calendar_id')
    if (!calendarId) {
      toast.error('No hay calendario configurado')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/google/calendar/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      
      if (response.ok) {
        const events = await response.json()
        setGoogleEvents(events)
        
        // Actualizar tareas que tengan fbTaskId
        events.forEach((event: FocusEvent) => {
          if (event.fbTaskId) {
            const task = tasks.find(t => t.id === event.fbTaskId)
            if (task) {
              updateTask(task.id, {
                title: event.title,
                dueDate: event.start,
              })
            }
          }
        })
        
        toast.success(`${events.length} eventos obtenidos de Google`)
      } else {
        throw new Error('Error al obtener eventos')
      }
    } catch (error) {
      toast.error('Error al obtener eventos de Google')
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectCalendar = async () => {
    // Limpiar datos locales
    localStorage.removeItem('google_calendar_id')
    setGoogleStatus({ authenticated: false })
    setGoogleEvents([])
    setIsDisconnectDialogOpen(false)
    toast.success('Calendario desconectado')
  }

  const syncWithGoogle = async () => {
    const calendarId = localStorage.getItem('google_calendar_id')
    if (!calendarId) {
      toast.error('No hay calendario configurado')
      return
    }

    setIsLoading(true)
    try {
      // Primero hacer Pull (obtener eventos)
      console.log('Pulling events from Google...')
      const pullResponse = await fetch('/api/google/calendar/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      
      if (pullResponse.ok) {
        const events = await pullResponse.json()
        setGoogleEvents(events)
        
        // Actualizar tareas que tengan fbTaskId
        events.forEach((event: FocusEvent) => {
          if (event.fbTaskId) {
            const task = tasks.find(t => t.id === event.fbTaskId)
            if (task) {
              updateTask(task.id, {
                title: event.title,
                dueDate: event.start,
              })
            }
          }
        })
        
        console.log(`Pulled ${events.length} events from Google`)
      } else {
        console.warn('Error pulling events:', await pullResponse.text())
      }

      // Luego hacer Push (enviar tareas)
      console.log('Pushing tasks to Google...')
      const tasksWithDueDate = tasks.filter(task => task.dueDate)
      const focusEvents: FocusEvent[] = tasksWithDueDate.map(task => ({
        title: task.title,
        description: task.description || '',
        start: task.dueDate!,
        end: task.dueDate!,
        allDay: true,
        fbTaskId: task.id,
      }))

      if (focusEvents.length > 0) {
        const pushResponse = await fetch('/api/google/calendar/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: focusEvents }),
        })
        
        if (pushResponse.ok) {
          const result = await pushResponse.json()
          console.log(`Pushed ${result.created + result.updated} events to Google`)
          toast.success(`Sincronización completa: ${result.created} creados, ${result.updated} actualizados`)
        } else {
          console.warn('Error pushing events:', await pushResponse.text())
          toast.error('Error al enviar tareas a Google')
        }
      } else {
        toast.info('No hay tareas con fecha de vencimiento para sincronizar')
      }
      
    } catch (error) {
      console.error('Sync error:', error)
      toast.error('Error al sincronizar con Google')
    } finally {
      setIsLoading(false)
    }
  }

  // Preparar eventos para FullCalendar
  const calendarEvents: EventInput[] = [
    // Eventos del calendario local
    ...events.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      allDay: event.allDay,
      start: event.allDay ? event.date : `${event.date}T${event.startTime}`,
      end: event.allDay ? undefined : `${event.date}T${event.endTime}`,
      backgroundColor: "#3b82f6",
      borderColor: "#1d4ed8",
      textColor: "#ffffff",
      classNames: ['fc-event-custom'],
      extendedProps: {
        type: "event",
        description: event.description,
        linkedTaskId: event.linkedTaskId,
      },
    })),
    // Eventos de Google Calendar
    ...googleEvents.map((event) => ({
      id: `google-${event.id}`,
      title: `📅 ${event.title}`,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      backgroundColor: "#10b981",
      borderColor: "#059669",
      textColor: "#ffffff",
      classNames: ['fc-event-custom', 'fc-google-event'],
      extendedProps: {
        type: "google",
        description: event.description,
        fbTaskId: event.fbTaskId,
      },
    })),
    // Tareas con fecha de vencimiento
    ...tasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: `task-${task.id}`,
        title: `📋 ${task.title}`,
        date: task.dueDate!.split("T")[0],
        allDay: true,
        backgroundColor: "#f59e0b",
        borderColor: "#d97706",
        textColor: "#ffffff",
        classNames: ['fc-event-custom'],
        extendedProps: {
          type: "task",
          taskId: task.id,
          priority: task.priority,
        },
      })),
  ]

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo.startStr)
    setSelectedEvent(null)
    resetForm()
    setIsEventDialogOpen(true)
  }

  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventId = clickInfo.event.id
    const eventType = clickInfo.event.extendedProps.type

    if (eventType === "task") {
      toast.info("Esta es una tarea del Kanban")
      return
    }

    if (eventType === "google") {
      toast.info("Este es un evento de Google Calendar")
      return
    }

    const event = events.find((e) => e.id === eventId)
    if (event) {
      setSelectedEvent(event)
      setSelectedDate(event.date)
      setEventTitle(event.title)
      setEventDescription(event.description || "")
      setEventAllDay(event.allDay)
      setEventStartTime(event.startTime || "09:00")
      setEventEndTime(event.endTime || "10:00")
      setLinkedTaskId(event.linkedTaskId || "")
      setIsEventDialogOpen(true)
    }
  }

  const resetForm = () => {
    setEventTitle("")
    setEventDescription("")
    setEventAllDay(true)
    setEventStartTime("09:00")
    setEventEndTime("10:00")
    setLinkedTaskId("")
  }

  const handleSaveEvent = () => {
    if (!eventTitle.trim()) {
      toast.error("El título es obligatorio")
      return
    }

    const eventData = {
      title: eventTitle.trim(),
      date: selectedDate,
      allDay: eventAllDay,
      startTime: eventAllDay ? undefined : eventStartTime,
      endTime: eventAllDay ? undefined : eventEndTime,
      description: eventDescription.trim() || undefined,
      linkedTaskId: linkedTaskId || undefined,
    }

    if (selectedEvent) {
      updateEvent(selectedEvent.id, eventData)
      toast.success("Evento actualizado")
    } else {
      addEvent(eventData)
      toast.success("Evento creado")
    }

    setIsEventDialogOpen(false)
    resetForm()
  }

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      deleteEvent(selectedEvent.id)
      toast.success("Evento eliminado")
      setIsEventDialogOpen(false)
      resetForm()
    }
  }

  // Función eliminada - ahora usamos las funciones específicas

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Calendario
        </h2>
        <div className="flex items-center gap-2">
          {googleStatus.authenticated && (
            <Badge variant="outline" className="gap-1">
              <Cloud className="h-3 w-3" />
              Google Conectado
            </Badge>
          )}
          
          {!googleStatus.authenticated ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsSetupDialogOpen(true)}
              className="gap-2"
            >
              <Key className="h-4 w-4" />
              Conectar con Google
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={syncWithGoogle}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? "Sincronizando..." : "Sincronizar"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDisconnectDialogOpen(true)}
                className="gap-2"
              >
                <CloudOff className="h-4 w-4" />
                Desconectar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Calendar */}
      <Card className="p-4 flex-1">
        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={esLocale}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth",
            }}
            events={calendarEvents}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            height="auto"
            buttonText={{
              today: "Hoy",
              month: "Mes",
            }}
            // Mejorar legibilidad
            dayHeaderFormat={{ weekday: 'short' }}
            dayHeaderContent={(arg) => {
              const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
              return dayNames[arg.date.getDay()]
            }}
            // Estilos personalizados
            dayCellClassNames={(arg) => {
              const classes = []
              if (arg.isToday) classes.push('fc-today-custom')
              if (arg.isOtherMonth) classes.push('fc-other-month-custom')
              return classes
            }}
            eventClassNames={(arg) => {
              const classes = ['fc-event-custom']
              if (arg.event.extendedProps?.isGoogleEvent) {
                classes.push('fc-google-event')
              }
              return classes
            }}
          />
        </div>
      </Card>

      {/* Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? "Editar Evento" : "Crear Evento"}</DialogTitle>
            <DialogDescription>
              {selectedEvent ? "Modifica los detalles del evento" : "Crea un nuevo evento en el calendario"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Título *</Label>
              <Input
                id="event-title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Nombre del evento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Descripción</Label>
              <Textarea
                id="event-description"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Detalles adicionales..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-date">Fecha</Label>
              <Input
                id="event-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="all-day">Todo el día</Label>
              <Switch id="all-day" checked={eventAllDay} onCheckedChange={setEventAllDay} />
            </div>

            {!eventAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Hora inicio</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">Hora fin</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="linked-task">Vincular con tarea</Label>
              <Select value={linkedTaskId} onValueChange={setLinkedTaskId}>
                <SelectTrigger id="linked-task">
                  <SelectValue placeholder="Ninguna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveEvent} className="flex-1">
                {selectedEvent ? "Actualizar" : "Crear"}
              </Button>
              {selectedEvent && (
                <Button onClick={handleDeleteEvent} variant="destructive">
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Google Calendar Setup Dialog */}
      <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Google Calendar</DialogTitle>
            <DialogDescription>
              Conecta tu calendario de Google para sincronizar tareas y eventos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="calendar-id">ID del Calendario de Google</Label>
              <Input
                id="calendar-id"
                type="text"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                placeholder="ejemplo: 755f4d657f8d98e77b555da649aba70bfee3408e1e70a0070ca0080e43daac31@group.calendar.google.com"
              />
              <p className="text-xs text-muted-foreground">
                <strong>¿Cómo obtener el ID?</strong><br/>
                1. Ve a Google Calendar en tu navegador<br/>
                2. Haz clic en los 3 puntos del calendario que quieres usar<br/>
                3. Selecciona "Configuración y uso compartido"<br/>
                4. Copia el "ID del calendario" (es muy largo)
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={setupGoogleCalendar} 
                disabled={isLoading || !calendarId.trim()}
                className="flex-1"
              >
                {isLoading ? "Configurando..." : "Configurar"}
              </Button>
              <Button 
                onClick={() => {
                  setIsSetupDialogOpen(false)
                  setCalendarId("")
                }} 
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disconnect Calendar Dialog */}
      <Dialog open={isDisconnectDialogOpen} onOpenChange={setIsDisconnectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Desconectar Calendario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres desconectar tu calendario de Google? Esto eliminará la sincronización pero no afectará tus eventos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={disconnectCalendar}
              variant="destructive"
              className="flex-1"
            >
              Desconectar
            </Button>
            <Button 
              onClick={() => setIsDisconnectDialogOpen(false)} 
              variant="outline"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
