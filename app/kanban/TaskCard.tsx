"use client"

import { useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import type { Task } from "@/types/task"
import { useTaskStore } from "@/lib/stores/useTaskStore"
import { usePomodoroStore } from "@/lib/stores/usePomodoroStore"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { MoreVertical, Calendar, Play, Copy, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { TaskForm } from "./TaskForm"

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  const { deleteTask, duplicateTask } = useTaskStore()
  const { setActiveTask } = usePomodoroStore()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const priorityColors = {
    high: "destructive",
    medium: "default",
    low: "secondary",
  } as const

  const priorityLabels = {
    high: "Alta",
    medium: "Media",
    low: "Baja",
  }

  const handleDelete = () => {
    deleteTask(task.id)
    toast.success("Tarea eliminada")
    setIsDeleteDialogOpen(false)
  }

  const handleDuplicate = () => {
    duplicateTask(task.id)
    toast.success("Tarea duplicada")
  }

  const handleSetActive = () => {
    setActiveTask(task.id)
    toast.success(`Tarea activa: ${task.title}`)
  }

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium text-sm text-balance flex-1">{task.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1">
                <MoreVertical className="h-3 w-3" />
                <span className="sr-only">Opciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSetActive}>
                <Play className="h-4 w-4 mr-2" />
                Activar en Pomodoro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditSheetOpen(true)}>Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>}

        <div className="flex flex-wrap items-center gap-1 mb-2">
          <Badge variant={priorityColors[task.priority]} className="text-xs">
            {priorityLabels[task.priority]}
          </Badge>
          {task.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(task.dueDate), "d MMM yyyy", { locale: es })}</span>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarea "{task.title}" será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Editar Tarea</SheetTitle>
          </SheetHeader>
          <TaskForm task={task} onSuccess={() => setIsEditSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
