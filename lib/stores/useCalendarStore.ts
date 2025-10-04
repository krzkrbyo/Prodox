import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CalendarEvent, GoogleSyncState } from "@/types/calendar"

interface CalendarStore {
  events: CalendarEvent[]
  googleSync: GoogleSyncState

  // Actions
  addEvent: (event: Omit<CalendarEvent, "id" | "createdAt">) => void
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
  getEventsByDate: (date: string) => CalendarEvent[]

  // Google Calendar sync
  connectGoogle: () => Promise<void>
  disconnectGoogle: () => void
  syncToGoogle: () => Promise<void>
  syncFromGoogle: () => Promise<void>
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      events: [
        {
          id: "1",
          title: "Reunión de equipo",
          date: new Date().toISOString().split("T")[0],
          allDay: false,
          startTime: "10:00",
          endTime: "11:00",
          description: "Sprint planning",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Entrega de proyecto",
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          allDay: true,
          description: "Deadline final",
          createdAt: new Date().toISOString(),
        },
      ],
      googleSync: {
        isConnected: false,
        isSyncing: false,
        lastSync: undefined,
      },

      addEvent: (eventData) => {
        const newEvent: CalendarEvent = {
          ...eventData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ events: [...state.events, newEvent] }))
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((event) => (event.id === id ? { ...event, ...updates } : event)),
        }))
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        }))
      },

      getEventsByDate: (date) => {
        return get().events.filter((event) => event.date === date)
      },

      connectGoogle: async () => {
        set((state) => ({
          googleSync: { ...state.googleSync, isSyncing: true },
        }))

        try {
          // Importar dinámicamente para evitar errores en SSR
          const { initiateGoogleAuth } = await import("@/lib/google-calendar")
          const authUrl = await initiateGoogleAuth()

          // En producción, abrirías una ventana popup o redirigirías
          console.log("[Calendar Store] URL de autenticación:", authUrl)

          // Simular conexión exitosa
          set((state) => ({
            googleSync: {
              ...state.googleSync,
              isConnected: true,
              isSyncing: false,
              lastSync: new Date().toISOString(),
            },
          }))
        } catch (error) {
          console.error("[Calendar Store] Error al conectar con Google:", error)
          set((state) => ({
            googleSync: { ...state.googleSync, isSyncing: false },
          }))
          throw error
        }
      },

      disconnectGoogle: () => {
        set((state) => ({
          googleSync: {
            ...state.googleSync,
            isConnected: false,
            lastSync: undefined,
          },
        }))
      },

      syncToGoogle: async () => {
        const { googleSync, events } = get()

        if (!googleSync.isConnected) {
          throw new Error("No conectado con Google Calendar")
        }

        set((state) => ({
          googleSync: { ...state.googleSync, isSyncing: true },
        }))

        try {
          // Llamar al endpoint de sincronización
          const response = await fetch("/api/google-calendar/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ events }),
          })

          if (!response.ok) {
            throw new Error("Error al sincronizar")
          }

          const data = await response.json()

          set((state) => ({
            googleSync: {
              ...state.googleSync,
              isSyncing: false,
              lastSync: data.syncedAt,
            },
          }))
        } catch (error) {
          console.error("[Calendar Store] Error al sincronizar:", error)
          set((state) => ({
            googleSync: { ...state.googleSync, isSyncing: false },
          }))
          throw error
        }
      },

      syncFromGoogle: async () => {
        const { googleSync } = get()

        if (!googleSync.isConnected) {
          throw new Error("No conectado con Google Calendar")
        }

        set((state) => ({
          googleSync: { ...state.googleSync, isSyncing: true },
        }))

        try {
          // Llamar al endpoint de sincronización
          const response = await fetch("/api/google-calendar/sync")

          if (!response.ok) {
            throw new Error("Error al sincronizar")
          }

          const data = await response.json()

          // Agregar eventos de Google que no existan localmente
          const existingIds = new Set(get().events.map((e) => e.googleEventId))
          const newEvents = data.events.filter((e: any) => !existingIds.has(e.googleEventId))

          newEvents.forEach((eventData: any) => {
            get().addEvent(eventData)
          })

          set((state) => ({
            googleSync: {
              ...state.googleSync,
              isSyncing: false,
              lastSync: data.syncedAt,
            },
          }))
        } catch (error) {
          console.error("[Calendar Store] Error al sincronizar:", error)
          set((state) => ({
            googleSync: { ...state.googleSync, isSyncing: false },
          }))
          throw error
        }
      },
    }),
    {
      name: "calendar-storage",
    },
  ),
)
