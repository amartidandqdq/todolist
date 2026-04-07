import { useState, useEffect, useCallback } from 'react';

export interface Task {
  id: number;
  list_id: number;
  parent_id: number | null;
  title: string;
  notes: string;
  due_date: string | null;
  completed: number;
  completed_at: string | null;
  position: number;
  recurrence_rule: string | null;
  created_at: string;
  updated_at: string;
  subtasks?: Task[];
}

export interface TaskList {
  id: number;
  name: string;
  color: string;
  position: number;
  created_at: string;
}

const API = '/api';

async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (res.status === 204) return null as T;
  return res.json();
}

export function useLists() {
  const [lists, setLists] = useState<TaskList[]>([]);

  const load = useCallback(async () => {
    setLists(await fetchJSON(`${API}/lists`));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addList = async (name: string) => {
    await fetchJSON(`${API}/lists`, { method: 'POST', body: JSON.stringify({ name }) });
    await load();
  };

  const deleteList = async (id: number) => {
    await fetchJSON(`${API}/lists/${id}`, { method: 'DELETE' });
    await load();
  };

  return { lists, addList, deleteList, reload: load };
}

export function useTasks(listId: number) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchJSON<Task[]>(`${API}/tasks?list_id=${listId}`);
    setTasks(data);
    setLoading(false);
  }, [listId]);

  useEffect(() => { load(); }, [load]);

  const addTask = async (title: string, extra?: Partial<Task>) => {
    await fetchJSON(`${API}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ list_id: listId, title, ...extra }),
    });
    await load();
  };

  const updateTask = async (id: number, data: Partial<Task>) => {
    await fetchJSON(`${API}/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
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
    await fetchJSON(`${API}/tasks/${id}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ position }),
    });
    await load();
  };

  const addSubtask = async (parentId: number, title: string) => {
    await fetchJSON(`${API}/tasks/${parentId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    await load();
  };

  return { tasks, loading, addTask, updateTask, toggleComplete, deleteTask, reorderTask, addSubtask, reload: load };
}
