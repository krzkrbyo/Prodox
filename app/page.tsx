"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PomodoroPanel } from "./pomodoro/PomodoroPanel"
import { KanbanBoard } from "./kanban/KanbanBoard"
import { CalendarPanel } from "./calendar/CalendarPanel"
import { SearchBar } from "@/components/SearchBar"
import { Timer, LayoutGrid, Calendar } from "lucide-react"

export default function Page() {
  const [activeTab, setActiveTab] = useState("pomodoro")

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-balance">Prodox</h1>
          <p className="text-muted-foreground text-balance">
            Tu espacio de productividad integrado con Pomodoro, Kanban y Calendario
          </p>
        </div>

        {/* Search Bar - Solo visible en la vista Kanban */}
        {activeTab === "kanban" && (
          <div className="mb-4">
            <SearchBar />
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-800/50 shadow-lg border border-gray-700/50">
            <TabsTrigger value="pomodoro" className="gap-2 data-[state=active]:bg-gray-700/80 data-[state=active]:text-white data-[state=active]:border-gray-500 data-[state=active]:shadow-lg text-gray-300 hover:text-white hover:bg-gray-700/40">
              <Timer className="h-4 w-4" />
              <span className="hidden sm:inline">Pomodoro</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2 data-[state=active]:bg-gray-700/80 data-[state=active]:text-white data-[state=active]:border-gray-500 data-[state=active]:shadow-lg text-gray-300 hover:text-white hover:bg-gray-700/40">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Kanban</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2 data-[state=active]:bg-gray-700/80 data-[state=active]:text-white data-[state=active]:border-gray-500 data-[state=active]:shadow-lg text-gray-300 hover:text-white hover:bg-gray-700/40">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendario</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pomodoro" className="mt-0">
            <PomodoroPanel />
          </TabsContent>

          <TabsContent value="kanban" className="mt-0">
            <KanbanBoard />
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            <CalendarPanel />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>
            Atajos de teclado: <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl/Cmd + Space</kbd> para
            pausar/iniciar Pomodoro, <kbd className="px-2 py-1 bg-muted rounded text-xs">/</kbd> para buscar tareas
          </p>
        </footer>
      </div>
    </main>
  )
}
