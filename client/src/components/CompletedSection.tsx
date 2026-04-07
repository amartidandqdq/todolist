import TaskItem from './TaskItem';
import { Task } from '../types';

interface Props {
  tasks: Task[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onClick: (task: Task) => void;
  onAddSubtask: (parentId: number, title: string) => void;
}

export default function CompletedSection({ tasks, onToggle, onDelete, onClick, onAddSubtask }: Props) {
  if (tasks.length === 0) return null;

  return (
    <div className="completed-section">
      <h4>Completed</h4>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onClick={onClick}
          onAddSubtask={onAddSubtask}
        />
      ))}
    </div>
  );
}
