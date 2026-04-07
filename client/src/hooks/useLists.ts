import { useState, useEffect, useCallback } from 'react';
import { TaskList } from '../types';
import { API, fetchJSON } from '../utils/api';

export function useLists() {
  const [lists, setLists] = useState<TaskList[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setError(null); setLists(await fetchJSON(`${API}/lists`)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load lists'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addList = useCallback(async (name: string) => {
    try { await fetchJSON(`${API}/lists`, { method: 'POST', body: JSON.stringify({ name }) }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to add list'); }
  }, [load]);

  const renameList = useCallback(async (id: number, name: string) => {
    try { await fetchJSON(`${API}/lists/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to rename list'); }
  }, [load]);

  const deleteList = useCallback(async (id: number) => {
    try { await fetchJSON(`${API}/lists/${id}`, { method: 'DELETE' }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to delete list'); }
  }, [load]);

  return { lists, error, addList, renameList, deleteList, reload: load };
}
