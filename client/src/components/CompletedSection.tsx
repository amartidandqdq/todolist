import { memo, useState } from 'react';
import TaskItem from './TaskItem';
import { Task } from '../types';

interface Props {
  tasks: Task[];
  onToggle: (id: number) => void;
  onStar: (id: number) => void;
  onDelete: (id: number) => void;
  onClick: (task: Task) => void;
  onInlineEdit: (id: number, title: string) => void;
  onAddSubtask: (parentId: number, title: string) => void;
}

export default memo(function CompletedSection({ tasks, onToggle, onStar, onDelete, onClick, onInlineEdit, onAddSubtask }: Props) {
  const [open, setOpen] = useState(false);
  if (tasks.length === 0) return null;

  return (
    <div className="completed-section">
      <button className="completed-toggle" onClick={() => setOpen(!open)}>
        <span className={`arrow ${open ? 'open' : ''}`}>&#x25B6;</span>
        <span>Completed ({tasks.length})</span>
      </button>
      {open && tasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} onStar={onStar}
          onDelete={onDelete} onClick={onClick} onInlineEdit={onInlineEdit} onAddSubtask={onAddSubtask} />
      ))}
    </div>
  );
});
