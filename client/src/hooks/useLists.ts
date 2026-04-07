import { useState, useEffect, useCallback } from 'react';
import { TaskList } from '../types';
import { API, fetchJSON } from '../utils/api';

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
