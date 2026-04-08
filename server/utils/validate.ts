/**
 * @module utils/validate
 * Zero-dependency input validation for API request bodies.
 * Returns typed results: { valid: true, data } or { valid: false, error }.
 */

interface ValidResult<T> { valid: true; data: T }
interface InvalidResult { valid: false; error: string }
type Result<T> = ValidResult<T> | InvalidResult;

/** Validated task creation input */
export interface TaskInput {
  title: string;
  list_id?: number;
  parent_id?: number | null;
  notes?: string;
  due_date?: string | null;
  due_time?: string | null;
  recurrence_rule?: string | null;
  starred?: boolean;
}

/** Validated list creation input */
export interface ListInput {
  name: string;
  color?: string;
}

/**
 * Validate task creation/update input.
 * @param body - Raw request body
 * @returns Typed result with validated data or error
 */
export function validateTaskInput(body: unknown): Result<TaskInput> {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Body must be an object' };
  const b = body as Record<string, unknown>;
  if (typeof b.title !== 'string' || !b.title.trim()) return { valid: false, error: 'title is required and must be a non-empty string' };
  return { valid: true, data: b as unknown as TaskInput };
}

/**
 * Validate list creation input.
 * @param body - Raw request body
 * @returns Typed result with validated data or error
 */
export function validateListInput(body: unknown): Result<ListInput> {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Body must be an object' };
  const b = body as Record<string, unknown>;
  if (typeof b.name !== 'string' || !b.name.trim()) return { valid: false, error: 'name is required and must be a non-empty string' };
  return { valid: true, data: b as unknown as ListInput };
}
