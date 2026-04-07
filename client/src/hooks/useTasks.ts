import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { API, fetchJSON } from '../utils/api';

export function useTasks(listId: number) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setTasks(await fetchJSON<Task[]>(`${API}/tasks?list_id=${listId}`));
    setLoading(false);
  }, [listId]);

  useEffect(() => { load(); }, [load]);

  const addTask = async (title: string, extra?: Partial<Task>) => {
    await fetchJSON(`${API}/tasks`, { method: 'POST', body: JSON.stringify({ list_id: listId, title, ...extra }) });
    await load();
  };

  const updateTask = async (id: number, data: Partial<Task>) => {
    await fetchJSON(`${API}/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    await load();
  };

  const toggleComplete = async (id: number) => {
    await fetchJSON(`${API}/tasks/${id}/complete`, { method: 'PUT' });
    await load();
  };

  const deleteTask = async (id: number) => {
    await fetchJSON(`${API}/tasks/${id}`, { method: 'DELETE' });
    await load();
  };

  const reorderTask = async (id: number, position: number) => {
    await fetchJSON(`${API}/tasks/${id}/reorder`, { method: 'PUT', body: JSON.stringify({ position }) });
    await load();
  };

  const addSubtask = async (parentId: number, title: string) => {
    await fetchJSON(`${API}/tasks/${parentId}/subtasks`, { method: 'POST', body: JSON.stringify({ title }) });
    await load();
  };

  return { tasks, loading, addTask, updateTask, toggleComplete, deleteTask, reorderTask, addSubtask, reload: load };
}
