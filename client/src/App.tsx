import { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import { useLists } from './hooks/useLists';
import { useTasks } from './hooks/useTasks';

export default function App() {
  const { lists, addList, deleteList, error: listError } = useLists();
  const [activeListId, setActiveListId] = useState(1);
  const { tasks, loading, error: taskError, addTask, updateTask, toggleComplete, deleteTask, reorderTask, addSubtask } = useTasks(activeListId);

  useEffect(() => {
    if (lists.length > 0 && !lists.find((l) => l.id === activeListId)) {
      setActiveListId(lists[0].id);
    }
  }, [lists, activeListId]);

  const activeList = lists.find((l) => l.id === activeListId);
  const error = listError || taskError;

  const taskCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    lists.forEach((l) => { counts[l.id] = 0; });
    tasks.forEach((t) => { if (!t.completed) counts[activeListId] = (counts[activeListId] || 0) + 1; });
    return counts;
  }, [lists, tasks, activeListId]);

  return (
    <>
      {error && (
        <div style={{ position: 'fixed', top: 12, right: 12, background: 'var(--danger)', color: 'white', padding: '8px 16px', borderRadius: 'var(--radius)', zIndex: 100, fontSize: 13 }}>
          {error}
        </div>
      )}
      <Sidebar lists={lists} activeId={activeListId} onSelect={setActiveListId} onAdd={addList} onDelete={deleteList} taskCounts={taskCounts} />
      <TaskList listName={activeList?.name || 'Tasks'} tasks={tasks} loading={loading} onAddTask={addTask} onToggle={toggleComplete} onDelete={deleteTask} onUpdate={updateTask} onReorder={reorderTask} onAddSubtask={addSubtask} />
    </>
  );
}
