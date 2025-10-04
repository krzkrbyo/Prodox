"use client"

import type React from "react"

import { useState } from "react"
import { useTaskStore } from "@/lib/stores/useTaskStore"
import type { Task, TaskStatus, TaskPriority } from "@/types/task"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { toast } from "sonner"

interface TaskFormProps {
  task?: Task
  onSuccess?: () => void
}

export function TaskForm({ task, onSuccess }: TaskFormProps) {
  const { addTask, updateTask } = useTaskStore()
  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [status, setStatus] = useState<TaskStatus>(task?.status || "todo")
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || "medium")
  const [dueDate, setDueDate] = useState(task?.dueDate?.split("T")[0] || "")
  const [tags, setTags] = useState<string[]>(task?.tags || [])
  const [tagInput, setTagInput] = useState("")

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("El título es obligatorio")
      return
    }

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      tags,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    }

    if (task) {
      updateTask(task.id, taskData)
      toast.success("Tarea actualizada")
    } else {
      addTask(taskData)
      toast.success("Tarea creada")
    }

    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nombre de la tarea"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalles adicionales..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="todo">Por Hacer</SelectItem>
              <SelectItem value="inprogress">En Progreso</SelectItem>
              <SelectItem value="done">Completado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridad</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Fecha de vencimiento</Label>
        <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Etiquetas</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddTag()
              }
            }}
            placeholder="Agregar etiqueta..."
          />
          <Button type="button" onClick={handleAddTag} variant="outline">
            Agregar
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full">
        {task ? "Actualizar Tarea" : "Crear Tarea"}
      </Button>
    </form>
  )
}
