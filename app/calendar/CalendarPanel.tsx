"use client"

import { useState, useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { DateSelectArg, EventClickArg, EventInput } from "@fullcalendar/core"
import esLocale from "@fullcalendar/core/locales/es"
import { useCalendarStore } from "@/lib/stores/useCalendarStore"
import { useTaskStore } from "@/lib/stores/useTaskStore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Cloud, CloudOff, Download, Upload, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { CalendarEvent } from "@/types/calendar"
import type { FocusEvent, GoogleCalendarStatus } from "@/types/google"

export function CalendarPanel() {
  const { data: session } = useSession()
  const { events, addEvent, updateEvent, deleteEvent } = useCalendarStore()
  const { tasks, updateTask } = useTaskStore()

  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [googleStatus, setGoogleStatus] = useState<GoogleCalendarStatus>({ authenticated: false })
  const [googleEvents, setGoogleEvents] = useState<FocusEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
  }, [session])

  const checkGoogleStatus = async () => {
    try {
      const response = await fetch('/api/google/status')
      const status = await response.json()
      setGoogleStatus(status)
      
      // Guardar calendarId en localStorage si existe
      if (status.calendarId) {
        localStorage.setItem('focusboard_calendar_id', status.calendarId)
      }
    } catch (error) {
      console.error('Error checking Google status:', error)
    }
  }

  const ensureFocusBoardCalendar = async () => {
    if (!session?.accessToken) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/google/ensure-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        const { calendarId } = await response.json()
        localStorage.setItem('focusboard_calendar_id', calendarId)
        setGoogleStatus(prev => ({ ...prev, calendarId }))
        toast.success('Calendario FocusBoard configurado')
      } else {
        throw new Error('Error al configurar calendario')
      }
    } catch (error) {
      toast.error('Error al configurar calendario')
    } finally {
      setIsLoading(false)
    }
  }

  const pullFromGoogle = async () => {
    const calendarId = localStorage.getItem('focusboard_calendar_id')
    if (!calendarId) {
      toast.error('No hay calendario configurado')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/google/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId }),
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

  const pushToGoogle = async () => {
    const calendarId = localStorage.getItem('focusboard_calendar_id')
    if (!calendarId) {
      toast.error('No hay calendario configurado')
      return
    }

    // Mapear tareas con dueDate a FocusEvent
    const tasksWithDueDate = tasks.filter(task => task.dueDate)
    const focusEvents: FocusEvent[] = tasksWithDueDate.map(task => ({
      title: task.title,
      description: task.description || '',
      start: task.dueDate!,
      end: task.dueDate!,
      allDay: true,
      fbTaskId: task.id,
    }))

    if (focusEvents.length === 0) {
      toast.info('No hay tareas con fecha de vencimiento para sincronizar')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/google/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId, events: focusEvents }),
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(`Sincronizado: ${result.created} creados, ${result.updated} actualizados`)
      } else {
        throw new Error('Error al sincronizar eventos')
      }
    } catch (error) {
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
      backgroundColor: "oklch(0.488 0.243 264.376)",
      borderColor: "oklch(0.488 0.243 264.376)",
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
      backgroundColor: "oklch(0.4 0.2 120)",
      borderColor: "oklch(0.4 0.2 120)",
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
        backgroundColor: "oklch(0.269 0 0)",
        borderColor: "oklch(0.439 0 0)",
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
          
          {!session ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => signIn('google')}
              className="gap-2"
            >
              <CloudOff className="h-4 w-4" />
              Conectar con Google
            </Button>
          ) : !googleStatus.calendarId ? (
            <Button
              variant="outline"
              size="sm"
              onClick={ensureFocusBoardCalendar}
              disabled={isLoading}
              className="gap-2"
            >
              <Cloud className="h-4 w-4" />
              Usar calendario FocusBoard
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={pullFromGoogle}
                disabled={isLoading}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Pull desde Google
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={pushToGoogle}
                disabled={isLoading}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Push tareas → Google
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Calendar */}
      <Card className="p-4 flex-1">
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
        />
      </Card>

      {/* Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? "Editar Evento" : "Crear Evento"}</DialogTitle>
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
    </div>
  )
}
