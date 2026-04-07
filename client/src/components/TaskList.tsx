import { useState, useMemo, useCallback } from 'react';
import { Task } from '../types';
import AddTask from './AddTask';
import TaskDetail from './TaskDetail';
import SortableTask from './SortableTask';
import CompletedSection from './CompletedSection';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface Props {
  listName: string;
  tasks: Task[];
  loading?: boolean;
  onAddTask: (title: string) => void;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, data: Partial<Task>) => void;
  onReorder: (id: number, position: number) => void;
  onAddSubtask: (parentId: number, title: string) => void;
}

export default function TaskList({ listName, tasks, loading, onAddTask, onToggle, onDelete, onUpdate, onReorder, onAddSubtask }: Props) {
  const [selected, setSelected] = useState<Task | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const active = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completed = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active: a, over } = event;
    if (!over || a.id === over.id) return;
    const newIndex = active.findIndex((t) => t.id === over.id);
    if (newIndex !== -1) onReorder(a.id as number, newIndex);
  }, [active, onReorder]);

  return (
    <>
      <div className="main">
        <div className="main-header">
          <h2>{listName}</h2>
          {completed.length > 0 && (
            <button className="show-completed-btn" onClick={() => setShowCompleted(!showCompleted)}>
              {showCompleted ? 'Hide' : 'Show'} completed ({completed.length})
            </button>
          )}
        </div>

        <AddTask onAdd={onAddTask} />

        <div className="task-list">
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40 }}>Loading...</div>
          ) : (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={active.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {active.map((task) => (
                    <SortableTask key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onClick={setSelected} onAddSubtask={onAddSubtask} />
                  ))}
                </SortableContext>
              </DndContext>

              {active.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40 }}>No tasks yet. Add one above!</div>
              )}

              {showCompleted && <CompletedSection tasks={completed} onToggle={onToggle} onDelete={onDelete} onClick={setSelected} onAddSubtask={onAddSubtask} />}
            </>
          )}
        </div>
      </div>

      {selected && (
        <TaskDetail task={selected} onClose={() => setSelected(null)} onSave={(id, data) => { onUpdate(id, data); setSelected(null); }} />
      )}
    </>
  );
}
