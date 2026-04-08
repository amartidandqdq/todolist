/**
 * @module utils/taskValidation
 * Shared validation and query helpers for task routes.
 * Used by tasks.ts, batch.ts, subtasks.ts to avoid duplicated DB patterns.
 */
import db from '../db/index.js';

/** Task row as returned from SQLite */
interface TaskRow {
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
}

/**
 * Find a task by ID.
 * @param id - Task ID
 * @returns The task row or undefined
 */
export function findTask(id: number | string): TaskRow | undefined {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined;
}

/**
 * Compute the next available position for a task.
 * @param scope - Either { listId } for top-level tasks or { parentId } for subtasks
 * @returns The next position integer
 */
export function nextPosition(scope: { listId: number } | { parentId: number | string }): number {
  const row = 'parentId' in scope
    ? db.prepare('SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE parent_id = ?').get(scope.parentId) as any
    : db.prepare('SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE list_id = ? AND parent_id IS NULL').get(scope.listId) as any;
  return row.max + 1;
}

/**
 * Validate that a value is a non-empty array.
 * @param value - The value to check
 * @param name - Field name for the error message
 * @returns Error string or null if valid
 */
export function validateArray(value: unknown, name: string): string | null {
  if (!Array.isArray(value)) return `${name} must be an array`;
  return null;
}
