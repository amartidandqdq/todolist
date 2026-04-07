import { useState, useMemo, useCallback } from 'react';
import { Task, SortMode } from '../types';
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
  sort: SortMode;
  onSortChange: (s: SortMode) => void;
  onAddTask: (title: string) => void;
  onToggle: (id: number) => void;
  onStar: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, data: Partial<Task>) => void;
  onReorder: (id: number, position: number) => void;
  onAddSubtask: (parentId: number, title: string) => void;
}

export default function TaskList({ listName, tasks, loading, sort, onSortChange, onAddTask, onToggle, onStar, onDelete, onUpdate, onReorder, onAddSubtask }: Props) {
  const [selected, setSelected] = useState<Task | null>(null);
  const [showSort, setShowSort] = useState(false);

  const active = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completed = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active: a, over } = event;
    if (!over || a.id === over.id) return;
    const newIndex = active.findIndex((t) => t.id === over.id);
    if (newIndex !== -1) onReorder(a.id as number, newIndex);
  }, [active, onReorder]);

  const sortLabels: Record<SortMode, string> = { my_order: 'My order', date: 'Date', starred: 'Starred' };

  return (
    <>
      <div className="main">
        <div className="main-header">
          <h2>{listName}</h2>
          <div style={{ position: 'relative' }}>
            <button className="sort-btn" onClick={() => setShowSort(!showSort)}>
              &#x2195; {sortLabels[sort]}
            </button>
            {showSort && (
              <div className="sort-menu">
                {(['my_order', 'date', 'starred'] as SortMode[]).map((s) => (
                  <button key={s} className={sort === s ? 'active' : ''}
                    onClick={() => { onSortChange(s); setShowSort(false); }}>
                    {sort === s ? '\u2713 ' : '  '}{sortLabels[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <AddTask onAdd={onAddTask} />

        <div className="task-list" onClick={() => setShowSort(false)}>
          {loading ? (
            <div className="empty-state">Loading...</div>
          ) : (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={active.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {active.map((task) => (
                    <SortableTask key={task.id} task={task} onToggle={onToggle} onStar={onStar}
                      onDelete={onDelete} onClick={setSelected} onAddSubtask={onAddSubtask} />
                  ))}
                </SortableContext>
              </DndContext>

              {active.length === 0 && !loading && (
                <div className="empty-state">
                  <div className="icon">&#x2713;</div>
                  <div>No tasks yet</div>
                </div>
              )}

              <CompletedSection tasks={completed} onToggle={onToggle} onStar={onStar}
                onDelete={onDelete} onClick={setSelected} onAddSubtask={onAddSubtask} />
            </>
          )}
        </div>
      </div>

      {selected && (
        <TaskDetail task={selected} onClose={() => setSelected(null)}
          onSave={(id, data) => { onUpdate(id, data); setSelected(null); }}
          onDelete={(id) => { onDelete(id); setSelected(null); }} />
      )}
    </>
  );
}
