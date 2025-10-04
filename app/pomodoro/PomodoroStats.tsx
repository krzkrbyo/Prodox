"use client"

import { usePomodoroStore } from "@/lib/stores/usePomodoroStore"
import { useTaskStore } from "@/lib/stores/useTaskStore"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Target, Flame } from "lucide-react"

export function PomodoroStats() {
  const { getTodaySessions, getTotalFocusTime, activeTaskId } = usePomodoroStore()
  const { tasks } = useTaskStore()

  const todaySessions = getTodaySessions()
  const focusSessions = todaySessions.filter((s) => s.type === "focus")
  const totalFocusTime = getTotalFocusTime()

  // Formatear tiempo total
  const hours = Math.floor(totalFocusTime / (1000 * 60 * 60))
  const minutes = Math.floor((totalFocusTime % (1000 * 60 * 60)) / (1000 * 60))

  // Obtener tarea activa
  const activeTask = tasks.find((t) => t.id === activeTaskId)

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Flame className="h-4 w-4 text-primary" />
        Estadísticas de hoy
      </h3>
      <div className="space-y-3">
        {/* Pomodoros completados */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            <span>Pomodoros</span>
          </div>
          <Badge variant="secondary" className="font-mono">
            {focusSessions.length}
          </Badge>
        </div>

        {/* Tiempo total enfocado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Tiempo enfocado</span>
          </div>
          <Badge variant="secondary" className="font-mono">
            {hours > 0 ? `${hours}h ` : ""}
            {minutes}m
          </Badge>
        </div>

        {/* Tarea activa */}
        {activeTask && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Tarea actual</p>
            <p className="text-sm font-medium text-balance">{activeTask.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  activeTask.priority === "high"
                    ? "destructive"
                    : activeTask.priority === "medium"
                      ? "default"
                      : "secondary"
                }
                className="text-xs"
              >
                {activeTask.priority === "high" ? "Alta" : activeTask.priority === "medium" ? "Media" : "Baja"}
              </Badge>
              {activeTask.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
