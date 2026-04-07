import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { API, fetchJSON } from '../utils/api';

export function useTasks(listId: number) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setTasks(await fetchJSON<Task[]>(`${API}/tasks?list_id=${listId}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => { load(); }, [load]);

  const wrap = useCallback((fn: () => Promise<void>) => async () => {
    try { setError(null); await fn(); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Action failed'); }
  }, [load]);

  const addTask = useCallback((title: string, extra?: Partial<Task>) =>
    wrap(() => fetchJSON(`${API}/tasks`, { method: 'POST', body: JSON.stringify({ list_id: listId, title, ...extra }) }))()
  , [listId, wrap]);

  const updateTask = useCallback((id: number, data: Partial<Task>) =>
    wrap(() => fetchJSON(`${API}/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }))()
  , [wrap]);

  const toggleComplete = useCallback((id: number) =>
    wrap(() => fetchJSON(`${API}/tasks/${id}/complete`, { method: 'PUT' }))()
  , [wrap]);

  const deleteTask = useCallback((id: number) =>
    wrap(() => fetchJSON(`${API}/tasks/${id}`, { method: 'DELETE' }))()
  , [wrap]);

  const reorderTask = useCallback((id: number, position: number) =>
    wrap(() => fetchJSON(`${API}/tasks/${id}/reorder`, { method: 'PUT', body: JSON.stringify({ position }) }))()
  , [wrap]);

  const addSubtask = useCallback((parentId: number, title: string) =>
    wrap(() => fetchJSON(`${API}/tasks/${parentId}/subtasks`, { method: 'POST', body: JSON.stringify({ title }) }))()
  , [wrap]);

  return { tasks, loading, error, addTask, updateTask, toggleComplete, deleteTask, reorderTask, addSubtask, reload: load };
}
