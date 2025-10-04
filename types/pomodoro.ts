export type PomodoroMode = "focus" | "shortBreak" | "longBreak" | "idle"

export interface PomodoroConfig {
  focusDuration: number // en minutos
  shortBreakDuration: number
  longBreakDuration: number
  cyclesBeforeLongBreak: number
}

export interface PomodoroSession {
  id: string
  taskId?: string
  startedAt: string
  endedAt: string
  type: "focus" | "shortBreak" | "longBreak"
  completed: boolean
}

export interface PomodoroState {
  mode: PomodoroMode
  timeRemaining: number // en segundos
  isRunning: boolean
  currentCycle: number
  config: PomodoroConfig
  activeTaskId?: string
  sessions: PomodoroSession[]
}
