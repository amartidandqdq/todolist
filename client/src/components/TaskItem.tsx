import { memo } from 'react';
import { Task } from '../types';
import { formatDate, recurrenceLabel } from '../utils/format';
import SubtaskList from './SubtaskList';
import SubtaskInput from './SubtaskInput';

interface Props {
  task: Task;
  onToggle: (id: number) => void;
  onStar: (id: number) => void;
  onDelete: (id: number) => void;
  onClick: (task: Task) => void;
  onAddSubtask: (parentId: number, title: string) => void;
}

export default memo(function TaskItem({ task, onToggle, onStar, onDelete, onClick, onAddSubtask }: Props) {
  const dateStr = formatDate(task.due_date);
  const isOverdue = dateStr?.startsWith('Overdue');
  const isToday = dateStr === 'Today';
  const recLabel = recurrenceLabel(task.recurrence_rule);
  const subCount = task.subtasks?.length || 0;

  return (
    <div>
      <div className={`task-item ${task.completed ? 'completed' : ''}`}>
        <div className={`task-checkbox ${task.completed ? 'checked' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }} />
        <div className="task-content" onClick={() => onClick(task)}>
          <div className="task-title">{task.title}</div>
          {(dateStr || recLabel || subCount > 0) && (
            <div className="task-meta">
              {dateStr && <span className={isOverdue ? 'overdue' : isToday ? 'due-today' : ''}>{dateStr}</span>}
              {recLabel && <span className="recurrence">&#x21BB; {recLabel}</span>}
              {subCount > 0 && <span>{task.subtasks!.filter(s => s.completed).length}/{subCount}</span>}
            </div>
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
