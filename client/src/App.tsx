import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import { useLists } from './hooks/useLists';
import { useTasks } from './hooks/useTasks';

export default function App() {
  const { lists, addList, deleteList } = useLists();
  const [activeListId, setActiveListId] = useState(1);
  const { tasks, addTask, updateTask, toggleComplete, deleteTask, reorderTask, addSubtask } = useTasks(activeListId);

  useEffect(() => {
    if (lists.length > 0 && !lists.find((l) => l.id === activeListId)) {
      setActiveListId(lists[0].id);
    }
  }, [lists, activeListId]);

  const activeList = lists.find((l) => l.id === activeListId);
  const taskCounts: Record<number, number> = {};
  lists.forEach((l) => { taskCounts[l.id] = 0; });
  tasks.forEach((t) => { if (!t.completed) taskCounts[activeListId] = (taskCounts[activeListId] || 0) + 1; });

  return (
    <>
      <Sidebar lists={lists} activeId={activeListId} onSelect={setActiveListId} onAdd={addList} onDelete={deleteList} taskCounts={taskCounts} />
      <TaskList listName={activeList?.name || 'Tasks'} tasks={tasks} onAddTask={addTask} onToggle={toggleComplete} onDelete={deleteTask} onUpdate={updateTask} onReorder={reorderTask} onAddSubtask={addSubtask} />
    </>
  );
}
