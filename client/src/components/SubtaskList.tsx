import { memo } from 'react';
import { Task } from '../types';

interface Props {
  subtasks: Task[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

export default memo(function SubtaskList({ subtasks, onToggle, onDelete }: Props) {
  if (subtasks.length === 0) return null;

  return (
    <div className="subtasks">
      {subtasks.map((sub) => (
        <div key={sub.id} className={`task-item ${sub.completed ? 'completed' : ''}`}>
          <div
            className={`task-checkbox ${sub.completed ? 'checked' : ''}`}
            onClick={() => onToggle(sub.id)}
          />
          <div className="task-content">
            <div className="task-title">{sub.title}</div>
          </div>
          <button className="task-delete" onClick={() => onDelete(sub.id)}>×</button>
        </div>
      ))}
    </div>
  );
});
