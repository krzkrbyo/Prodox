"use client"

import { useState } from "react"
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
import { CalendarIcon, Cloud, CloudOff } from "lucide-react"
import { toast } from "sonner"
import type { CalendarEvent } from "@/types/calendar"

export function CalendarPanel() {
  const { events, addEvent, updateEvent, deleteEvent, googleSync, connectGoogle, disconnectGoogle, syncToGoogle } =
    useCalendarStore()
  const { tasks } = useTaskStore()

  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  // Form state
  const [eventTitle, setEventTitle] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventAllDay, setEventAllDay] = useState(true)
  const [eventStartTime, setEventStartTime] = useState("09:00")
  const [eventEndTime, setEventEndTime] = useState("10:00")
  const [linkedTaskId, setLinkedTaskId] = useState<string>("")

  // Preparar eventos para FullCalendar
  const calendarEvents: EventInput[] = [
    // Eventos del calendario
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

  const handleGoogleSync = async () => {
    if (!googleSync.isConnected) {
      try {
        await connectGoogle()
        toast.success("Conectado con Google Calendar")
      } catch (error) {
        toast.error("Error al conectar con Google")
      }
    } else {
      try {
        await syncToGoogle()
        toast.success("Sincronizado con Google Calendar")
      } catch (error) {
        toast.error("Error al sincronizar")
      }
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Calendario
        </h2>
        <div className="flex items-center gap-2">
          {googleSync.isConnected && (
            <Badge variant="outline" className="gap-1">
              <Cloud className="h-3 w-3" />
              Conectado
            </Badge>
          )}
          <Button
            variant={googleSync.isConnected ? "outline" : "default"}
            size="sm"
            onClick={handleGoogleSync}
            disabled={googleSync.isSyncing}
            className="gap-2"
          >
            {googleSync.isConnected ? <Cloud className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
            {googleSync.isSyncing ? "Sincronizando..." : googleSync.isConnected ? "Sincronizar" : "Conectar Google"}
          </Button>
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
