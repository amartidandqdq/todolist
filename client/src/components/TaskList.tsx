import { useState, useMemo, useCallback } from 'react';
import { Task, SortMode } from '../types';
import AddTask from './AddTask';
import TaskDetail from './TaskDetail';
import SortableTask from './SortableTask';
import CompletedSection from './CompletedSection';
import SearchBar from './SearchBar';
import CalendarView from './CalendarView';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface Props {
  listName: string;
  tasks: Task[];
  allTasks: Task[];
  loading?: boolean;
  sort: SortMode;
  search: string;
  viewMode: string;
  emptyMessage: string;
  onSortChange: (s: SortMode) => void;
  onSearchChange: (q: string) => void;
  onAddTask: (title: string) => void;
  onToggle: (id: number) => void;
  onStar: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, data: Partial<Task>) => void;
  onInlineEdit: (id: number, title: string) => void;
  onReorder: (id: number, position: number) => void;
  onAddSubtask: (parentId: number, title: string) => void;
  onBatchComplete: (ids: number[]) => void;
  onBatchDelete: (ids: number[]) => void;
}

export default function TaskList(props: Props) {
  const { listName, tasks, allTasks, loading, sort, search, viewMode, emptyMessage,
    onSortChange, onSearchChange, onAddTask, onToggle, onStar, onDelete, onUpdate,
    onInlineEdit, onReorder, onAddSubtask, onBatchComplete, onBatchDelete } = props;

  const [selected, setSelected] = useState<Task | null>(null);
  const [showSort, setShowSort] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const active = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completed = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active: a, over } = event;
    if (!over || a.id === over.id) return;
    const newIndex = active.findIndex((t) => t.id === over.id);
    if (newIndex !== -1) onReorder(a.id as number, newIndex);
  }, [active, onReorder]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const clearSelection = () => setSelectedIds(new Set());
  const sortLabels: Record<SortMode, string> = { my_order: 'My order', date: 'Date', starred: 'Starred' };

  const taskProps = { onToggle, onStar, onDelete, onClick: setSelected, onInlineEdit, onAddSubtask, onSelect: toggleSelect };

  return (
    <>
      <div className="main">
        <div className="main-header">
          <h2>{listName}</h2>
          <SearchBar value={search} onChange={onSearchChange} />
          <button className="sort-btn" onClick={() => setShowCalendar(!showCalendar)} title="Calendar">
            &#x1F4C5;
          </button>
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

        {showCalendar && <CalendarView tasks={allTasks} onSelectDate={(d) => onSearchChange(d)} />}

        {selectedIds.size > 0 && (
          <div className="batch-bar">
            <span>{selectedIds.size} selected</span>
            <button onClick={() => { onBatchComplete([...selectedIds]); clearSelection(); }}>Complete</button>
            <button className="danger" onClick={() => { onBatchDelete([...selectedIds]); clearSelection(); }}>Delete</button>
            <button onClick={clearSelection}>Cancel</button>
          </div>
        )}

        <AddTask onAdd={onAddTask} />

        <div className="task-list" onClick={() => setShowSort(false)}>
          {loading ? (
            <div className="empty-state">Loading...</div>
          ) : (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={active.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {active.map((task) => (
                    <SortableTask key={task.id} task={task} selected={selectedIds.has(task.id)} {...taskProps} />
                  ))}
                </SortableContext>
              </DndContext>

              {active.length === 0 && !loading && (
                <div className="empty-state">
                  <div className="icon">{viewMode === 'starred' ? '\u2606' : '\u2713'}</div>
                  <div>{emptyMessage}</div>
                </div>
              )}

              <CompletedSection tasks={completed} {...taskProps} />
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
