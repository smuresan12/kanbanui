export type Column = 'Backlog' | 'To Do' | 'In Progress' | 'Done';

export const COLUMNS: Column[] = ['Backlog', 'To Do', 'In Progress', 'Done'];

export interface Sticky {
  id: string;
  text: string;
  color: string;
  column: Column;
  createdAt: string; // ISO date string
}

export interface KanbanState {
  stickies: Sticky[];
  usedColors: string[]; // Colors already used for easy suggestion
} 