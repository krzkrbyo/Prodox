export type FocusEvent = {
  id?: string;
  title: string;
  description?: string;
  start: string; // ISO
  end: string;   // ISO
  allDay?: boolean;
  fbTaskId?: string; // id de la tarea local
}

export type GoogleCalendarStatus = {
  authenticated: boolean;
  calendarId?: string;
}

export type CalendarOperationResult = {
  created: number;
  updated: number;
  unchanged: number;
}
