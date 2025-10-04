import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Task, TaskStatus, TaskFilters } from "@/types/task"

interface TaskStore {
  tasks: Task[]
  filters: TaskFilters
  activeTaskId?: string

  // Actions
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  duplicateTask: (id: string) => void
  moveTask: (id: string, newStatus: TaskStatus) => void
  setActiveTask: (id?: string) => void
  setFilters: (filters: Partial<TaskFilters>) => void
  getFilteredTasks: () => Task[]
  getTasksByStatus: (status: TaskStatus) => Task[]
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [
        {
          id: "1",
          title: "Diseñar interfaz de usuario",
          description: "Crear mockups para la nueva funcionalidad",
          status: "inprogress",
          priority: "high",
          tags: ["diseño", "ui"],
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Revisar documentación técnica",
          description: "Actualizar docs del API",
          status: "todo",
          priority: "medium",
          tags: ["documentación"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "3",
          title: "Implementar autenticación",
          status: "todo",
          priority: "high",
          tags: ["backend", "seguridad"],
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "4",
          title: "Optimizar rendimiento",
          description: "Reducir tiempo de carga",
          status: "backlog",
          priority: "low",
          tags: ["performance"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "5",
          title: "Configurar CI/CD",
          status: "done",
          priority: "medium",
          tags: ["devops"],
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "6",
          title: "Escribir tests unitarios",
          description: "Cobertura mínima del 80%",
          status: "todo",
          priority: "medium",
          tags: ["testing", "calidad"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      filters: {
        searchText: "",
        selectedTags: [],
      },

      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ tasks: [...state.tasks, newTask] }))
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task,
          ),
        }))
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
          activeTaskId: state.activeTaskId === id ? undefined : state.activeTaskId,
        }))
      },

      duplicateTask: (id) => {
        const task = get().tasks.find((t) => t.id === id)
        if (task) {
          const duplicated: Task = {
            ...task,
            id: crypto.randomUUID(),
            title: `${task.title} (copia)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          set((state) => ({ tasks: [...state.tasks, duplicated] }))
        }
      },

      moveTask: (id, newStatus) => {
        get().updateTask(id, { status: newStatus })
      },

      setActiveTask: (id) => {
        set({ activeTaskId: id })
      },

      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }))
      },

      getFilteredTasks: () => {
        const { tasks, filters } = get()
        return tasks.filter((task) => {
          const matchesSearch =
            task.title.toLowerCase().includes(filters.searchText.toLowerCase()) ||
            task.description?.toLowerCase().includes(filters.searchText.toLowerCase())

          const matchesTags =
            filters.selectedTags.length === 0 || filters.selectedTags.some((tag) => task.tags.includes(tag))

          const matchesPriority = !filters.selectedPriority || task.priority === filters.selectedPriority

          return matchesSearch && matchesTags && matchesPriority
        })
      },

      getTasksByStatus: (status) => {
        return get()
          .getFilteredTasks()
          .filter((task) => task.status === status)
      },
    }),
    {
      name: "focusboard-tasks",
    },
  ),
)
