/**
 * @module types
 * Shared TypeScript interfaces for the TodoList client.
 */

/** A task (or subtask if parent_id is set) */
export interface Task {
  id: number;
  list_id: number;
  parent_id: number | null;
  title: string;
  notes: string;
  due_date: string | null;
  due_time: string | null;
  completed: number;
  completed_at: string | null;
  starred: number;
  position: number;
  recurrence_rule: string | null;
  created_at: string;
  updated_at: string;
  subtasks?: Task[];
}

/** A named task list (e.g. "Work", "Personal") */
export interface TaskList {
  id: number;
  name: string;
  color: string;
  position: number;
  created_at: string;
}

/** Sort modes matching Google Tasks: custom order, by date, or by starred */
export type SortMode = 'my_order' | 'date' | 'starred';

/** Navigation view modes */
export type ViewMode = 'list' | 'all' | 'starred';
