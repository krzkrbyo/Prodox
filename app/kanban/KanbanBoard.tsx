"use client"

import { useState } from "react"
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { useTaskStore } from "@/lib/stores/useTaskStore"
import type { TaskStatus } from "@/types/task"
import { TaskCard } from "./TaskCard"
import { TaskForm } from "./TaskForm"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "Por Hacer" },
  { id: "inprogress", label: "En Progreso" },
  { id: "done", label: "Completado" },
]

export function KanbanBoard() {
  const { getTasksByStatus, moveTask, tasks } = useTaskStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus

    // Verificar si es una columna válida
    if (COLUMNS.some((col) => col.id === newStatus)) {
      moveTask(taskId, newStatus)
    }

    setActiveId(null)
  }

  const activeTask = tasks.find((t) => t.id === activeId)

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header con botón de nueva tarea */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tablero Kanban</h2>
        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Tarea
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Crear Nueva Tarea</SheetTitle>
            </SheetHeader>
            <TaskForm onSuccess={() => setIsFormOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Kanban Board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
          {COLUMNS.map((column) => {
            const columnTasks = getTasksByStatus(column.id)
            return (
              <Card
                key={column.id}
                id={column.id}
                className="flex flex-col p-4 bg-card/50"
                role="region"
                aria-label={`Columna ${column.label}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">{column.label}</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                  {columnTasks.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                      Sin tareas
                    </div>
                  ) : (
                    columnTasks.map((task) => <TaskCard key={task.id} task={task} />)
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <div className="opacity-50">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
