import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskItem from './TaskItem';
import { Task } from '../types';

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

export default function SortableTask({ task, ...props }: Props) {
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
