export type Column = 'Backlog' | 'To Do' | 'In Progress' | 'Done';

export const COLUMNS: Column[] = ['Backlog', 'To Do', 'In Progress', 'Done'];

export interface Sticky {
  id: string;
  text: string;
  color: string;
  column: Column;
  createdAt: string; // ISO date string
  // Add index signature for dnd-action shadow item marker
  [key: string]: string | boolean | Column;
}

export interface KanbanState {
  stickies: Sticky[];
  usedColors: string[]; // Colors already used for easy suggestion
  lastBackupDate: string | null; // ISO date string when last backup was made
  disableBackupReminders?: boolean; // Flag to disable backup reminders
} 