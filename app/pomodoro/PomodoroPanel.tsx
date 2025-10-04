"use client"

import { useEffect } from "react"
import { usePomodoroStore } from "@/lib/stores/usePomodoroStore"
import { useTaskStore } from "@/lib/stores/useTaskStore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Pause, RotateCcw, Settings } from "lucide-react"
import { PomodoroStats } from "./PomodoroStats"

export function PomodoroPanel() {
  const {
    mode,
    timeRemaining,
    isRunning,
    config,
    activeTaskId,
    start,
    pause,
    reset,
    tick,
    setActiveTask,
    updateConfig,
  } = usePomodoroStore()
  const { tasks } = useTaskStore()

  // Timer tick effect
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        tick()
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isRunning, tick])

  // Formatear tiempo
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const timeDisplay = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

  // Obtener nombre del modo
  const modeLabels = {
    idle: "Listo",
    focus: "Enfoque",
    shortBreak: "Descanso Corto",
    longBreak: "Descanso Largo",
  }

  // Obtener tarea activa
  const activeTask = tasks.find((t) => t.id === activeTaskId)

  // Atajos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === " " && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        isRunning ? pause() : start()
      } else if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        start()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isRunning, start, pause])

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6">
        <div className="flex flex-col items-center gap-6">
          {/* Modo actual */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Modo actual</p>
            <h3 className="text-lg font-semibold">{modeLabels[mode]}</h3>
          </div>

          {/* Timer display */}
          <div className="relative">
            <div className="text-7xl font-mono font-bold tracking-tight">{timeDisplay}</div>
            {mode !== "idle" && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-full">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-1000"
                    style={{
                      width: `${((config[mode === "focus" ? "focusDuration" : mode === "shortBreak" ? "shortBreakDuration" : "longBreakDuration"] * 60 - timeRemaining) / (config[mode === "focus" ? "focusDuration" : mode === "shortBreak" ? "shortBreakDuration" : "longBreakDuration"] * 60)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="flex items-center gap-2 mt-4">
            <Button onClick={isRunning ? pause : start} size="lg" className="gap-2">
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Iniciar
                </>
              )}
            </Button>
            <Button onClick={reset} variant="outline" size="lg">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configuración del Pomodoro</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="focus-duration">Duración de enfoque (minutos)</Label>
                    <Input
                      id="focus-duration"
                      type="number"
                      min="1"
                      max="60"
                      value={config.focusDuration}
                      onChange={(e) => updateConfig({ focusDuration: Number.parseInt(e.target.value) || 25 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="short-break">Descanso corto (minutos)</Label>
                    <Input
                      id="short-break"
                      type="number"
                      min="1"
                      max="30"
                      value={config.shortBreakDuration}
                      onChange={(e) => updateConfig({ shortBreakDuration: Number.parseInt(e.target.value) || 5 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="long-break">Descanso largo (minutos)</Label>
                    <Input
                      id="long-break"
                      type="number"
                      min="1"
                      max="60"
                      value={config.longBreakDuration}
                      onChange={(e) => updateConfig({ longBreakDuration: Number.parseInt(e.target.value) || 15 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cycles">Ciclos antes de descanso largo</Label>
                    <Input
                      id="cycles"
                      type="number"
                      min="1"
                      max="10"
                      value={config.cyclesBeforeLongBreak}
                      onChange={(e) => updateConfig({ cyclesBeforeLongBreak: Number.parseInt(e.target.value) || 4 })}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Selector de tarea activa */}
          <div className="w-full space-y-2">
            <Label htmlFor="active-task">Tarea activa</Label>
            <Select
              value={activeTaskId || "none"}
              onValueChange={(value) => setActiveTask(value === "none" ? undefined : value)}
            >
              <SelectTrigger id="active-task">
                <SelectValue placeholder="Seleccionar tarea..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {tasks
                  .filter((t) => t.status !== "done")
                  .map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {activeTask && (
              <p className="text-xs text-muted-foreground">
                Trabajando en: <span className="font-medium text-foreground">{activeTask.title}</span>
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Estadísticas */}
      <PomodoroStats />
    </div>
  )
}
