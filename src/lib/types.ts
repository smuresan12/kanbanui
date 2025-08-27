export const COLUMNS: string[] = ['To Do', 'In Progress'/*, 'In Progress'*/, 'Booked'];

export type Column = typeof COLUMNS[number];

export interface Sticky {
  id: string;
  patientName: string;
  notes: string;
  color: string;
  column: string;
  createdAt: string; // ISO date string
  // Add index signature for dnd-action shadow item marker
  [key: string]: string | boolean | string;
}

export interface KanbanState {
  stickies: Sticky[];
  usedColors: string[]; // Colors already used for easy suggestion
  lastBackupDate: string | null; // ISO date string when last backup was made
  disableBackupReminders?: boolean; // Flag to disable backup reminders
  lastSkippedDate?: string | null; // ISO date string when user last skipped backup for a week
} 