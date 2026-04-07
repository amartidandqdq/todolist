import { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import UndoToast from './components/UndoToast';
import { useLists } from './hooks/useLists';
import { useTasks } from './hooks/useTasks';
import { useTheme } from './hooks/useTheme';
import { ViewMode, SortMode, Task } from './types';
import { API, fetchJSON } from './utils/api';

export default function App() {
  const { lists, addList, renameList, deleteList, error: listError, reload: reloadLists } = useLists();
  const [activeListId, setActiveListId] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sort, setSort] = useState<SortMode>('my_order');
  const [search, setSearch] = useState('');
  const { theme, toggle: toggleTheme } = useTheme();
  const [undo, setUndo] = useState<{ message: string; action: () => void } | null>(null);

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

  // Undo-able complete
  const handleToggle = useCallback(async (id: number) => {
    const task = tasks.find((t) => t.id === id || t.subtasks?.some((s) => s.id === id));
    const target = task?.id === id ? task : task?.subtasks?.find((s) => s.id === id);
    await toggleComplete(id);
    if (target && !target.completed) {
      setUndo({ message: 'Task completed', action: () => { toggleComplete(id); setUndo(null); } });
    }
  }, [tasks, toggleComplete]);

  // Undo-able delete
  const handleDelete = useCallback(async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    await deleteTask(id);
    if (task) {
      setUndo({
        message: 'Task deleted',
        action: async () => {
          await fetchJSON(`${API}/tasks`, { method: 'POST', body: JSON.stringify({ list_id: task.list_id, title: task.title, notes: task.notes, due_date: task.due_date }) });
          reload(); setUndo(null);
        },
      });
    }
  }, [tasks, deleteTask, reload]);

  const handleInlineEdit = useCallback((id: number, title: string) => {
    updateTask(id, { title } as Partial<Task>);
  }, [updateTask]);

  const handleBatchComplete = useCallback(async (ids: number[]) => {
    for (const id of ids) await toggleComplete(id);
  }, [toggleComplete]);

  const handleBatchDelete = useCallback(async (ids: number[]) => {
    await fetchJSON(`${API}/tasks/batch`, { method: 'DELETE', body: JSON.stringify({ ids }) });
    reload();
  }, [reload]);

  const handleImported = useCallback(() => { reloadLists(); reload(); }, [reloadLists, reload]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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

  return (
    <>
      {error && (
        <div className="error-toast">{error}</div>
      )}
      {undo && <UndoToast message={undo.message} onUndo={undo.action} onDismiss={() => setUndo(null)} />}
      <Sidebar lists={lists} activeListId={activeListId} viewMode={viewMode}
        onSelectList={setActiveListId} onSelectView={setViewMode}
        onAdd={addList} onRename={renameList} onDelete={deleteList} taskCounts={taskCounts}
        theme={theme} onToggleTheme={toggleTheme} onImported={handleImported} />
      <TaskList listName={listName} tasks={tasks} allTasks={tasks} loading={loading}
        sort={sort} search={search} viewMode={viewMode} emptyMessage={emptyMessage}
        onSortChange={setSort} onSearchChange={setSearch}
        onAddTask={addTask} onToggle={handleToggle} onStar={toggleStar}
        onDelete={handleDelete} onUpdate={updateTask} onInlineEdit={handleInlineEdit}
        onReorder={reorderTask} onAddSubtask={addSubtask}
        onBatchComplete={handleBatchComplete} onBatchDelete={handleBatchDelete} />
    </>
  );
}
