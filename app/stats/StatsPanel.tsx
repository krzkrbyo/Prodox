"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts"
import { 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  Zap,
  Award,
  Activity,
  BarChart3
} from "lucide-react"
import { usePomodoroStore } from "@/lib/stores/usePomodoroStore"
import { useTaskStore } from "@/lib/stores/useTaskStore"

export function StatsPanel() {
  const { sessions, completedSessions, totalTime } = usePomodoroStore()
  const { tasks } = useTaskStore()
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week')

  // Calcular estadísticas básicas
  const totalSessions = sessions.length
  const completedSessionsCount = completedSessions.length
  const completionRate = totalSessions > 0 ? (completedSessionsCount / totalSessions) * 100 : 0
  const averageSessionTime = completedSessionsCount > 0 ? totalTime / completedSessionsCount : 0

  // Calcular estadísticas por período
  const getStatsForPeriod = (period: 'week' | 'month' | 'year') => {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
    }

    const periodSessions = sessions.filter(session => 
      new Date(session.startTime) >= startDate
    )
    
    const periodCompleted = periodSessions.filter(session => session.completed)
    const periodTime = periodCompleted.reduce((total, session) => total + session.duration, 0)

    return {
      sessions: periodSessions.length,
      completed: periodCompleted.length,
      totalTime: periodTime,
      completionRate: periodSessions.length > 0 ? (periodCompleted.length / periodSessions.length) * 100 : 0
    }
  }

  const currentStats = getStatsForPeriod(timeRange)

  // Datos para gráficos
  const getDailyStats = () => {
    const days = []
    const now = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.startTime)
        return sessionDate >= dayStart && sessionDate < dayEnd
      })
      
      const completedSessions = daySessions.filter(session => session.completed)
      const totalTime = completedSessions.reduce((total, session) => total + session.duration, 0)
      
      days.push({
        day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        date: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        sessions: daySessions.length,
        completed: completedSessions.length,
        time: Math.round(totalTime / 60), // en minutos
        productivity: completedSessions.length > 0 ? (completedSessions.length / daySessions.length) * 100 : 0
      })
    }
    
    return days
  }

  const getWeeklyStats = () => {
    const weeks = []
    const now = new Date()
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      
      const weekSessions = sessions.filter(session => {
        const sessionDate = new Date(session.startTime)
        return sessionDate >= weekStart && sessionDate < weekEnd
      })
      
      const completedSessions = weekSessions.filter(session => session.completed)
      const totalTime = completedSessions.reduce((total, session) => total + session.duration, 0)
      
      weeks.push({
        week: `Sem ${4 - i}`,
        sessions: weekSessions.length,
        completed: completedSessions.length,
        time: Math.round(totalTime / 60), // en minutos
        productivity: weekSessions.length > 0 ? (completedSessions.length / weekSessions.length) * 100 : 0
      })
    }
    
    return weeks
  }

  const getProductivityData = () => {
    const productivityRanges = [
      { range: '0-25%', count: 0, color: '#ef4444' },
      { range: '25-50%', count: 0, color: '#f97316' },
      { range: '50-75%', count: 0, color: '#eab308' },
      { range: '75-100%', count: 0, color: '#22c55e' }
    ]

    // Agrupar sesiones por día y calcular productividad
    const dailyProductivity = getDailyStats().map(day => day.productivity)
    
    dailyProductivity.forEach(prod => {
      if (prod >= 75) productivityRanges[3].count++
      else if (prod >= 50) productivityRanges[2].count++
      else if (prod >= 25) productivityRanges[1].count++
      else productivityRanges[0].count++
    })

    return productivityRanges
  }

  const dailyData = getDailyStats()
  const weeklyData = getWeeklyStats()
  const productivityData = getProductivityData()

  // Calcular racha actual
  const getCurrentStreak = () => {
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.startTime)
        return sessionDate >= dayStart && sessionDate < dayEnd
      })
      
      if (daySessions.length > 0) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  const currentStreak = getCurrentStreak()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Estadísticas de Productividad
          </h2>
          <p className="text-muted-foreground">
            Análisis detallado de tu tiempo de trabajo con Pomodoro
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={timeRange === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('week')}
          >
            Semana
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('month')}
          >
            Mes
          </Button>
          <Button
            variant={timeRange === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('year')}
          >
            Año
          </Button>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sesiones Completadas</p>
              <p className="text-2xl font-bold">{currentStats.completed}</p>
              <p className="text-xs text-muted-foreground">
                {currentStats.sessions} total
              </p>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tiempo Total</p>
              <p className="text-2xl font-bold">{Math.round(currentStats.totalTime / 60)}m</p>
              <p className="text-xs text-muted-foreground">
                {Math.round(currentStats.totalTime / 3600)}h {Math.round((currentStats.totalTime % 3600) / 60)}m
              </p>
            </div>
            <Clock className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tasa de Éxito</p>
              <p className="text-2xl font-bold">{Math.round(currentStats.completionRate)}%</p>
              <p className="text-xs text-muted-foreground">
                {currentStats.completed}/{currentStats.sessions} sesiones
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Racha Actual</p>
              <p className="text-2xl font-bold">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">
                días consecutivos
              </p>
            </div>
            <Zap className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Actividad Diaria */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Actividad Diaria
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'time' ? `${value} min` : value,
                    name === 'time' ? 'Tiempo' : name === 'completed' ? 'Completadas' : 'Sesiones'
                  ]}
                  labelFormatter={(label) => `Día: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="time" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Gráfico de Productividad */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Distribución de Productividad
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productivityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, count }) => `${range}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {productivityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Gráfico de Sesiones por Semana */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sesiones por Semana
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value,
                    name === 'completed' ? 'Completadas' : 'Total'
                  ]}
                />
                <Bar dataKey="sessions" fill="#6b7280" name="Total" />
                <Bar dataKey="completed" fill="#22c55e" name="Completadas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Gráfico de Tendencias */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendencias de Productividad
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Productividad']}
                />
                <Line 
                  type="monotone" 
                  dataKey="productivity" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Resumen de Logros */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5" />
          Logros y Métricas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{totalSessions}</p>
            <p className="text-sm text-blue-600">Sesiones Totales</p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{Math.round(totalTime / 3600)}h</p>
            <p className="text-sm text-green-600">Tiempo Total</p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{Math.round(completionRate)}%</p>
            <p className="text-sm text-purple-600">Tasa de Éxito</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
