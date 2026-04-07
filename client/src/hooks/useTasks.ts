import { useState, useEffect, useCallback } from 'react';
import { Task, SortMode } from '../types';
import { API, fetchJSON } from '../utils/api';

/** Options for filtering/sorting the task query */
interface UseTasksOpts {
  listId?: number;
  starred?: boolean;
  sort?: SortMode;
  search?: string;
}

/**
 * Hook for CRUD operations on tasks within a filtered view.
 * Auto-loads on mount and when opts change.
 * @param opts - Filter/sort options
 * @returns Task state + all mutation functions
 */
export function useTasks({ listId, starred, sort, search }: UseTasksOpts) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch tasks matching current filters */
  const load = useCallback(async (): Promise<void> => {
    try {
      setLoading(true); setError(null);
      const params = new URLSearchParams();
      if (listId) params.set('list_id', String(listId));
      if (starred) params.set('starred', 'true');
      if (sort) params.set('sort', sort);
      if (search) params.set('q', search);
      setTasks(await fetchJSON<Task[]>(`${API}/tasks?${params}`));
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [listId, starred, sort, search]);

  useEffect(() => { load(); }, [load]);

  /** Wrap an async action with error handling and auto-reload */
  const wrap = useCallback((fn: () => Promise<void>) => async (): Promise<void> => {
    try { setError(null); await fn(); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Action failed'); }
  }, [load]);

  /** Create a new task */
  const addTask = useCallback((title: string, extra?: Partial<Task>): Promise<void> =>
    wrap(() => fetchJSON(`${API}/tasks`, { method: 'POST', body: JSON.stringify({ list_id: listId || 1, title, ...extra }) }))()
  , [listId, wrap]);

  /** Update task fields by ID */
  const updateTask = useCallback((id: number, data: Partial<Task>): Promise<void> =>
    wrap(() => fetchJSON(`${API}/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }))()
  , [wrap]);

  /** Toggle task completion */
  const toggleComplete = useCallback((id: number): Promise<void> =>
    wrap(() => fetchJSON(`${API}/tasks/${id}/complete`, { method: 'PUT' }))()
  , [wrap]);

  /** Toggle task starred status */
  const toggleStar = useCallback((id: number): Promise<void> =>
    wrap(() => fetchJSON(`${API}/tasks/${id}/star`, { method: 'PUT' }))()
  , [wrap]);

  /** Delete a task by ID */
  const deleteTask = useCallback((id: number): Promise<void> =>
    wrap(() => fetchJSON(`${API}/tasks/${id}`, { method: 'DELETE' }))()
  , [wrap]);

  /** Move task to a new position */
  const reorderTask = useCallback((id: number, position: number): Promise<void> =>
    wrap(() => fetchJSON(`${API}/tasks/${id}/reorder`, { method: 'PUT', body: JSON.stringify({ position }) }))()
  , [wrap]);

  /** Make task a subtask of the task above it */
  const indentTask = useCallback((id: number): Promise<void> =>
    wrap(() => fetchJSON(`${API}/tasks/${id}/indent`, { method: 'PUT' }))()
  , [wrap]);

  /** Promote subtask to a top-level task */
  const unindentTask = useCallback((id: number): Promise<void> =>
    wrap(() => fetchJSON(`${API}/tasks/${id}/unindent`, { method: 'PUT' }))()
  , [wrap]);

  /** Add a subtask under a parent task */
  const addSubtask = useCallback((parentId: number, title: string): Promise<void> =>
    wrap(() => fetchJSON(`${API}/tasks/${parentId}/subtasks`, { method: 'POST', body: JSON.stringify({ title }) }))()
  , [wrap]);

  return { tasks, loading, error, addTask, updateTask, toggleComplete, toggleStar, deleteTask, reorderTask, indentTask, unindentTask, addSubtask, reload: load };
}
