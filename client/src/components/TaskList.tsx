import { useState } from 'react';
import { Task } from '../hooks/useTasks';
import TaskItem from './TaskItem';
import AddTask from './AddTask';
import TaskDetail from './TaskDetail';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  listName: string;
  tasks: Task[];
  onAddTask: (title: string) => void;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, data: Partial<Task>) => void;
  onReorder: (id: number, position: number) => void;
  onAddSubtask: (parentId: number, title: string) => void;
}

function SortableTask({ task, ...props }: { task: Task } & Omit<React.ComponentProps<typeof TaskItem>, 'task'>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskItem task={task} {...props} />
    </div>
  );
}

export default function TaskList({ listName, tasks, onAddTask, onToggle, onDelete, onUpdate, onReorder, onAddSubtask }: Props) {
  const [selected, setSelected] = useState<Task | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = activeTasks.findIndex((t) => t.id === active.id);
    const newIndex = activeTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(active.id as number, newIndex);
  };

  return (
    <>
      <div className="main">
        <div className="main-header">
          <h2>{listName}</h2>
          {completedTasks.length > 0 && (
            <button className="show-completed-btn" onClick={() => setShowCompleted(!showCompleted)}>
              {showCompleted ? 'Hide' : 'Show'} completed ({completedTasks.length})
            </button>
          )}
        </div>

        <AddTask onAdd={onAddTask} />

        <div className="task-list">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={activeTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {activeTasks.map((task) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onClick={setSelected}
                  onAddSubtask={onAddSubtask}
                />
              ))}
            </SortableContext>
          </DndContext>

          {activeTasks.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40 }}>
              No tasks yet. Add one above!
            </div>
          )}

          {showCompleted && completedTasks.length > 0 && (
            <div className="completed-section">
              <h4>Completed</h4>
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onClick={setSelected}
                  onAddSubtask={onAddSubtask}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <TaskDetail
          task={selected}
          onClose={() => setSelected(null)}
          onSave={(id, data) => { onUpdate(id, data); setSelected(null); }}
        />
      )}
    </>
  );
}
