import { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import { useLists } from './hooks/useLists';
import { useTasks } from './hooks/useTasks';
import { ViewMode, SortMode } from './types';

export default function App() {
  const { lists, addList, deleteList, error: listError } = useLists();
  const [activeListId, setActiveListId] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sort, setSort] = useState<SortMode>('my_order');

  const taskOpts = useMemo(() => ({
    listId: viewMode === 'list' ? activeListId : undefined,
    starred: viewMode === 'starred' ? true : undefined,
    sort,
  }), [viewMode, activeListId, sort]);

  const { tasks, loading, error: taskError, addTask, updateTask, toggleComplete, toggleStar, deleteTask, reorderTask, addSubtask } = useTasks(taskOpts);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        alert('Keyboard shortcuts:\n\nEnter = New task (when input focused)\nSpace = Toggle complete\nTab = Indent task\nShift+Tab = Unindent task\nS = Star task\nDelete = Delete task');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {error && (
        <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', background: 'var(--danger)', color: 'var(--bg)', padding: '8px 20px', borderRadius: 20, zIndex: 100, fontSize: 13, fontWeight: 500 }}>
          {error}
        </div>
      )}
      <Sidebar lists={lists} activeListId={activeListId} viewMode={viewMode}
        onSelectList={setActiveListId} onSelectView={setViewMode}
        onAdd={addList} onDelete={deleteList} taskCounts={taskCounts} />
      <TaskList listName={listName} tasks={tasks} loading={loading}
        sort={sort} onSortChange={setSort}
        onAddTask={addTask} onToggle={toggleComplete} onStar={toggleStar}
        onDelete={deleteTask} onUpdate={updateTask} onReorder={reorderTask} onAddSubtask={addSubtask} />
    </>
  );
}
