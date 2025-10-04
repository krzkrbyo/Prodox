import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { PomodoroMode, PomodoroConfig, PomodoroSession, PomodoroState } from "@/types/pomodoro"

interface PomodoroStore extends PomodoroState {
  // Actions
  start: () => void
  pause: () => void
  reset: () => void
  tick: () => void
  completeSession: () => void
  setMode: (mode: PomodoroMode) => void
  setActiveTask: (taskId?: string) => void
  updateConfig: (config: Partial<PomodoroConfig>) => void
  getTodaySessions: () => PomodoroSession[]
  getTotalFocusTime: () => number
}

const DEFAULT_CONFIG: PomodoroConfig = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
}

export const usePomodoroStore = create<PomodoroStore>()(
  persist(
    (set, get) => ({
      mode: "idle",
      timeRemaining: DEFAULT_CONFIG.focusDuration * 60,
      isRunning: false,
      currentCycle: 0,
      config: DEFAULT_CONFIG,
      sessions: [],

      start: () => {
        const state = get()
        if (state.mode === "idle") {
          set({
            mode: "focus",
            timeRemaining: state.config.focusDuration * 60,
            isRunning: true,
          })
        } else {
          set({ isRunning: true })
        }
      },

      pause: () => {
        set({ isRunning: false })
      },

      reset: () => {
        const state = get()
        const duration =
          state.mode === "focus"
            ? state.config.focusDuration
            : state.mode === "shortBreak"
              ? state.config.shortBreakDuration
              : state.config.longBreakDuration

        set({
          timeRemaining: duration * 60,
          isRunning: false,
        })
      },

      tick: () => {
        const state = get()
        if (state.isRunning && state.timeRemaining > 0) {
          set({ timeRemaining: state.timeRemaining - 1 })

          if (state.timeRemaining - 1 === 0) {
            get().completeSession()
          }
        }
      },

      completeSession: () => {
        const state = get()

        // Registrar sesión completada
        if (state.mode !== "idle") {
          const session: PomodoroSession = {
            id: crypto.randomUUID(),
            taskId: state.activeTaskId,
            startedAt: new Date(
              Date.now() -
                (state.mode === "focus"
                  ? state.config.focusDuration
                  : state.mode === "shortBreak"
                    ? state.config.shortBreakDuration
                    : state.config.longBreakDuration) *
                  60 *
                  1000,
            ).toISOString(),
            endedAt: new Date().toISOString(),
            type: state.mode as "focus" | "shortBreak" | "longBreak",
            completed: true,
          }
          set((state) => ({ sessions: [...state.sessions, session] }))
        }

        // Determinar siguiente modo
        if (state.mode === "focus") {
          const newCycle = state.currentCycle + 1
          const isLongBreak = newCycle >= state.config.cyclesBeforeLongBreak

          set({
            mode: isLongBreak ? "longBreak" : "shortBreak",
            currentCycle: isLongBreak ? 0 : newCycle,
            timeRemaining: isLongBreak ? state.config.longBreakDuration * 60 : state.config.shortBreakDuration * 60,
            isRunning: false,
          })
        } else {
          set({
            mode: "focus",
            timeRemaining: state.config.focusDuration * 60,
            isRunning: false,
          })
        }
      },

      setMode: (mode) => {
        const state = get()
        const duration =
          mode === "focus"
            ? state.config.focusDuration
            : mode === "shortBreak"
              ? state.config.shortBreakDuration
              : mode === "longBreak"
                ? state.config.longBreakDuration
                : state.config.focusDuration

        set({
          mode,
          timeRemaining: duration * 60,
          isRunning: false,
        })
      },

      setActiveTask: (taskId) => {
        set({ activeTaskId: taskId })
      },

      updateConfig: (configUpdates) => {
        set((state) => ({
          config: { ...state.config, ...configUpdates },
        }))
      },

      getTodaySessions: () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        return get().sessions.filter((session) => {
          const sessionDate = new Date(session.startedAt)
          return sessionDate >= today && session.completed
        })
      },

      getTotalFocusTime: () => {
        const todaySessions = get().getTodaySessions()
        return todaySessions
          .filter((s) => s.type === "focus")
          .reduce((total, session) => {
            const duration = new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()
            return total + duration
          }, 0)
      },
    }),
    {
      name: "focusboard-pomodoro",
    },
  ),
)
