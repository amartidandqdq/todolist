import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLists } from './useLists';
import { useTasks } from './useTasks';
import { useTheme } from './useTheme';
import { useUndoManager } from './useUndoManager';
import { ViewMode, SortMode, Task } from '../types';
import { API, fetchJSON } from '../utils/api';

/**
 * Centralized application state hook.
 * Composes useLists, useTasks, useTheme, useUndoManager and
 * exposes derived state + all action handlers for the UI layer.
 * @returns All state and callbacks needed by App.tsx
 */
export function useAppState() {
  const { lists, addList, renameList, deleteList, error: listError, reload: reloadLists } = useLists();
  const [activeListId, setActiveListId] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sort, setSort] = useState<SortMode>('my_order');
  const [search, setSearch] = useState('');
  const { theme, toggle: toggleTheme } = useTheme();
  const { undo, push: pushUndo, dismiss: dismissUndo } = useUndoManager();

  const taskOpts = useMemo(() => ({
    listId: viewMode === 'list' ? activeListId : undefined,
    starred: viewMode === 'starred' ? true : undefined,
    sort, search,
  }), [viewMode, activeListId, sort, search]);

  const { tasks, loading, error: taskError, addTask, updateTask, toggleComplete, toggleStar, deleteTask, reorderTask, addSubtask, reload } = useTasks(taskOpts);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(reload, 30000);
    return () => clearInterval(interval);
  }, [reload]);

  // Tab badge
  useEffect(() => {
    const count = tasks.filter((t) => !t.completed).length;
    document.title = count > 0 ? `(${count}) TodoList` : 'TodoList';
  }, [tasks]);

  // Reset active list if deleted
  useEffect(() => {
    if (lists.length > 0 && !lists.find((l) => l.id === activeListId)) setActiveListId(lists[0].id);
  }, [lists, activeListId]);

  const activeList = lists.find((l) => l.id === activeListId);
  const error = listError || taskError;

  const taskCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    lists.forEach((l) => { counts[l.id] = 0; });
    if (viewMode === 'list') {
      tasks.forEach((t) => { if (!t.completed) counts[activeListId] = (counts[activeListId] || 0) + 1; });
    }
    return counts;
  }, [lists, tasks, activeListId, viewMode]);

  const listName = viewMode === 'starred' ? 'Starred' : (activeList?.name || 'Tasks');
  const emptyMessage = viewMode === 'starred' ? 'Star tasks to see them here'
    : search ? 'No tasks match your search' : 'No tasks yet';

  /** Toggle complete with undo toast */
  const handleToggle = useCallback(async (id: number): Promise<void> => {
    const task = tasks.find((t) => t.id === id || t.subtasks?.some((s) => s.id === id));
    const target = task?.id === id ? task : task?.subtasks?.find((s) => s.id === id);
    await toggleComplete(id);
    if (target && !target.completed) {
      pushUndo('Task completed', () => toggleComplete(id));
    }
  }, [tasks, toggleComplete, pushUndo]);

  /** Delete with undo toast (re-creates the task) */
  const handleDelete = useCallback(async (id: number): Promise<void> => {
    const task = tasks.find((t) => t.id === id);
    await deleteTask(id);
    if (task) {
      pushUndo('Task deleted', async () => {
        await fetchJSON(`${API}/tasks`, { method: 'POST', body: JSON.stringify({ list_id: task.list_id, title: task.title, notes: task.notes, due_date: task.due_date }) });
        reload();
      });
    }
  }, [tasks, deleteTask, reload, pushUndo]);

  /** Inline edit shortcut */
  const handleInlineEdit = useCallback((id: number, title: string): void => {
    updateTask(id, { title } as Partial<Task>);
  }, [updateTask]);

  /** Batch complete selected tasks */
  const handleBatchComplete = useCallback(async (ids: number[]): Promise<void> => {
    for (const id of ids) await toggleComplete(id);
  }, [toggleComplete]);

  /** Batch delete selected tasks */
  const handleBatchDelete = useCallback(async (ids: number[]): Promise<void> => {
    await fetchJSON(`${API}/tasks/batch`, { method: 'DELETE', body: JSON.stringify({ ids }) });
    reload();
  }, [reload]);

  /** Reload both lists and tasks after import */
  const handleImported = useCallback((): void => { reloadLists(); reload(); }, [reloadLists, reload]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        alert('Shortcuts:\nEnter = New task\nDouble-click = Inline edit\nSwipe right = Complete (mobile)\nCtrl+Click = Multi-select\nCtrl+/ = This help');
      }
      if (e.key === 'f' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setSearch(''); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return {
    // State
    lists, tasks, loading, error, undo,
    activeListId, viewMode, sort, search,
    theme, taskCounts, listName, emptyMessage,
    // List actions
    addList, renameList, deleteList,
    // View actions
    setActiveListId, setViewMode, setSort: setSort, setSearch,
    // Task actions
    addTask, updateTask, toggleStar, reorderTask, addSubtask,
    handleToggle, handleDelete, handleInlineEdit,
    handleBatchComplete, handleBatchDelete,
    // Misc
    toggleTheme, handleImported, dismissUndo,
  };
}
