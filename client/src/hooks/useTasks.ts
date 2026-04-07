import { useState, useEffect, useCallback } from 'react';
import { Task, SortMode } from '../types';
import { API, fetchJSON } from '../utils/api';

interface UseTasksOpts {
  listId?: number;
  starred?: boolean;
  sort?: SortMode;
  search?: string;
}

export function useTasks({ listId, starred, sort, search }: UseTasksOpts) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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

  const wrap = useCallback((fn: () => Promise<void>) => async () => {
    try { setError(null); await fn(); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Action failed'); }
  }, [load]);

  const addTask = useCallback((title: string, extra?: Partial<Task>) =>
    wrap(() => fetchJSON(`${API}/tasks`, { method: 'POST', body: JSON.stringify({ list_id: listId || 1, title, ...extra }) }))()
  , [listId, wrap]);

  const updateTask = useCallback((id: number, data: Partial<Task>) =>
    wrap(() => fetchJSON(`${API}/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }))()
  , [wrap]);

  const toggleComplete = useCallback((id: number) =>
    wrap(() => fetchJSON(`${API}/tasks/${id}/complete`, { method: 'PUT' }))()
  , [wrap]);

  const toggleStar = useCallback((id: number) =>
    wrap(() => fetchJSON(`${API}/tasks/${id}/star`, { method: 'PUT' }))()
  , [wrap]);

  const deleteTask = useCallback((id: number) =>
    wrap(() => fetchJSON(`${API}/tasks/${id}`, { method: 'DELETE' }))()
  , [wrap]);

  const reorderTask = useCallback((id: number, position: number) =>
    wrap(() => fetchJSON(`${API}/tasks/${id}/reorder`, { method: 'PUT', body: JSON.stringify({ position }) }))()
  , [wrap]);

  const indentTask = useCallback((id: number) =>
    wrap(() => fetchJSON(`${API}/tasks/${id}/indent`, { method: 'PUT' }))()
  , [wrap]);

  const unindentTask = useCallback((id: number) =>
    wrap(() => fetchJSON(`${API}/tasks/${id}/unindent`, { method: 'PUT' }))()
  , [wrap]);

  const addSubtask = useCallback((parentId: number, title: string) =>
    wrap(() => fetchJSON(`${API}/tasks/${parentId}/subtasks`, { method: 'POST', body: JSON.stringify({ title }) }))()
  , [wrap]);

  return { tasks, loading, error, addTask, updateTask, toggleComplete, toggleStar, deleteTask, reorderTask, indentTask, unindentTask, addSubtask, reload: load };
}
