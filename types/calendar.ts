export interface CalendarEvent {
  id: string
  title: string
  date: string
  allDay: boolean
  startTime?: string
  endTime?: string
  linkedTaskId?: string
  description?: string
  createdAt: string
}

export interface GoogleSyncState {
  isConnected: boolean
  lastSyncAt?: string
  isSyncing: boolean
}
