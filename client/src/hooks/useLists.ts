import { useState, useEffect, useCallback } from 'react';
import { TaskList } from '../types';
import { API, fetchJSON } from '../utils/api';

/**
 * Hook for CRUD operations on task lists.
 * Auto-loads on mount. Returns { lists, error, addList, renameList, deleteList, reload }.
 */
export function useLists() {
  const [lists, setLists] = useState<TaskList[]>([]);
  const [error, setError] = useState<string | null>(null);

  /** Fetch all lists from API */
  const load = useCallback(async (): Promise<void> => {
    try { setError(null); setLists(await fetchJSON(`${API}/lists`)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load lists'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Create a new list with the given name */
  const addList = useCallback(async (name: string): Promise<void> => {
    try { await fetchJSON(`${API}/lists`, { method: 'POST', body: JSON.stringify({ name }) }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to add list'); }
  }, [load]);

  /** Rename an existing list */
  const renameList = useCallback(async (id: number, name: string): Promise<void> => {
    try { await fetchJSON(`${API}/lists/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to rename list'); }
  }, [load]);

  /** Delete a list by ID (cascades to all its tasks) */
  const deleteList = useCallback(async (id: number): Promise<void> => {
    try { await fetchJSON(`${API}/lists/${id}`, { method: 'DELETE' }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to delete list'); }
  }, [load]);

  return { lists, error, addList, renameList, deleteList, reload: load };
}
