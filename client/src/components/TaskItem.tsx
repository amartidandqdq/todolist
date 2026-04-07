import { Task } from '../types';
import { formatDate, recurrenceLabel } from '../utils/format';
import SubtaskList from './SubtaskList';
import SubtaskInput from './SubtaskInput';

interface Props {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onClick: (task: Task) => void;
  onAddSubtask: (parentId: number, title: string) => void;
}

export default function TaskItem({ task, onToggle, onDelete, onClick, onAddSubtask }: Props) {
  const dateStr = formatDate(task.due_date);
  const isOverdue = dateStr?.startsWith('Overdue');
  const recLabel = recurrenceLabel(task.recurrence_rule);
  const subCount = task.subtasks?.length || 0;

  return (
    <div>
      <div className={`task-item ${task.completed ? 'completed' : ''}`}>
        <div
          className={`task-checkbox ${task.completed ? 'checked' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
        />
        <div className="task-content" onClick={() => onClick(task)}>
          <div className="task-title">{task.title}</div>
          {(dateStr || recLabel || subCount > 0) && (
            <div className="task-meta">
              {dateStr && <span className={isOverdue ? 'overdue' : ''}>{dateStr}</span>}
              {recLabel && <span className="recurrence">{recLabel}</span>}
              {subCount > 0 && <span>{task.subtasks!.filter(s => s.completed).length}/{subCount} subtasks</span>}
            </div>
          )}
        </div>
        <button className="task-delete" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>×</button>
      </div>

      {task.subtasks && <SubtaskList subtasks={task.subtasks} onToggle={onToggle} onDelete={onDelete} />}
      {!task.completed && <SubtaskInput taskId={task.id} onAdd={onAddSubtask} />}
    </div>
  );
}
