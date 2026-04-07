import { memo, useState, useRef } from 'react';
import { Task } from '../types';
import { formatDate, recurrenceLabel } from '../utils/format';
import SubtaskList from './SubtaskList';
import SubtaskInput from './SubtaskInput';

interface Props {
  task: Task;
  selected?: boolean;
  onToggle: (id: number) => void;
  onStar: (id: number) => void;
  onDelete: (id: number) => void;
  onClick: (task: Task) => void;
  onInlineEdit: (id: number, title: string) => void;
  onAddSubtask: (parentId: number, title: string) => void;
  onSelect?: (id: number, multi: boolean) => void;
}

export default memo(function TaskItem({ task, selected, onToggle, onStar, onDelete, onClick, onInlineEdit, onAddSubtask, onSelect }: Props) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const dateStr = formatDate(task.due_date);
  const isOverdue = dateStr?.startsWith('Overdue');
  const isToday = dateStr === 'Today';
  const recLabel = recurrenceLabel(task.recurrence_rule);
  const subCount = task.subtasks?.length || 0;

  const handleDoubleClick = () => { setEditing(true); setEditTitle(task.title); };
  const handleEditDone = () => {
    if (editTitle.trim() && editTitle !== task.title) onInlineEdit(task.id, editTitle.trim());
    setEditing(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);
    if (dx > 80 && dy < 40) onToggle(task.id); // swipe right = complete
    touchStart.current = null;
  };

  return (
    <div>
      <div className={`task-item ${task.completed ? 'completed' : ''} ${selected ? 'selected' : ''}`}
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
        onClick={(e) => { if (onSelect && (e.ctrlKey || e.metaKey || e.shiftKey)) { e.preventDefault(); onSelect(task.id, e.shiftKey); return; } }}
      >
        <div className={`task-checkbox ${task.completed ? 'checked' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }} />
        <div className="task-content" onClick={() => !editing && onClick(task)} onDoubleClick={handleDoubleClick}>
          {editing ? (
            <input className="inline-edit" autoFocus value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleEditDone(); if (e.key === 'Escape') setEditing(false); }}
              onBlur={handleEditDone}
              onClick={(e) => e.stopPropagation()} />
          ) : (
            <>
              <div className="task-title">{task.title}</div>
              {(dateStr || recLabel || subCount > 0) && (
                <div className="task-meta">
                  {dateStr && <span className={isOverdue ? 'overdue' : isToday ? 'due-today' : ''}>{dateStr}</span>}
                  {recLabel && <span className="recurrence">&#x21BB; {recLabel}</span>}
                  {subCount > 0 && <span>{task.subtasks!.filter(s => s.completed).length}/{subCount}</span>}
                </div>
              )}
            </>
          )}
        </div>
        <button className={`task-star ${task.starred ? 'starred' : ''}`}
          onClick={(e) => { e.stopPropagation(); onStar(task.id); }}>
          {task.starred ? '\u2605' : '\u2606'}
        </button>
        <div className="task-actions">
          <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} title="Delete">&#x2715;</button>
        </div>
      </div>
      {task.subtasks && <SubtaskList subtasks={task.subtasks} onToggle={onToggle} onDelete={onDelete} />}
      {!task.completed && <SubtaskInput taskId={task.id} onAdd={onAddSubtask} />}
    </div>
  );
});
