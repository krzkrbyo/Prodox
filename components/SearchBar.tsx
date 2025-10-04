"use client"

import { useState, useEffect } from "react"
import { useTaskStore } from "@/lib/stores/useTaskStore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Filter, X } from "lucide-react"
import type { TaskPriority } from "@/types/task"

export function SearchBar() {
  const { filters, setFilters, tasks } = useTaskStore()
  const [searchInput, setSearchInput] = useState(filters.searchText)

  // Obtener todas las etiquetas únicas
  const allTags = Array.from(new Set(tasks.flatMap((task) => task.tags)))

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters({ searchText: searchInput })
    }, 300)

    return () => clearTimeout(handler)
  }, [searchInput, setFilters])

  const toggleTag = (tag: string) => {
    const newTags = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter((t) => t !== tag)
      : [...filters.selectedTags, tag]
    setFilters({ selectedTags: newTags })
  }

  const setPriorityFilter = (priority?: TaskPriority) => {
    setFilters({ selectedPriority: priority })
  }

  const clearFilters = () => {
    setSearchInput("")
    setFilters({ searchText: "", selectedTags: [], selectedPriority: undefined })
  }

  const hasActiveFilters = filters.searchText || filters.selectedTags.length > 0 || filters.selectedPriority

  // Atajo de teclado para buscar
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        document.getElementById("search-input")?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="search-input"
          type="text"
          placeholder="Buscar tareas... (presiona /)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative bg-transparent">
            <Filter className="h-4 w-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" aria-label="Filtros activos" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Filtros</h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpiar
                </Button>
              )}
            </div>

            {/* Filtro de prioridad */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Prioridad</p>
              <div className="flex gap-2">
                <Badge
                  variant={filters.selectedPriority === "high" ? "destructive" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setPriorityFilter(filters.selectedPriority === "high" ? undefined : "high")}
                >
                  Alta
                </Badge>
                <Badge
                  variant={filters.selectedPriority === "medium" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setPriorityFilter(filters.selectedPriority === "medium" ? undefined : "medium")}
                >
                  Media
                </Badge>
                <Badge
                  variant={filters.selectedPriority === "low" ? "secondary" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setPriorityFilter(filters.selectedPriority === "low" ? undefined : "low")}
                >
                  Baja
                </Badge>
              </div>
            </div>

            {/* Filtro de etiquetas */}
            {allTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Etiquetas</p>
                <div className="flex flex-wrap gap-1">
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={filters.selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer gap-1"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                      {filters.selectedTags.includes(tag) && <X className="h-3 w-3" />}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
