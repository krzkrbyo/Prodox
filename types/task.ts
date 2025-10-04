export type TaskStatus = "backlog" | "todo" | "inprogress" | "done"
export type TaskPriority = "low" | "medium" | "high"

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  tags: string[]
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface TaskFilters {
  searchText: string
  selectedTags: string[]
  selectedPriority?: TaskPriority
}
