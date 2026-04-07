import { useState } from 'react';

interface Props {
  taskId: number;
  onAdd: (parentId: number, title: string) => void;
}

export default function SubtaskInput({ taskId, onAdd }: Props) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="subtask-add">
        <button onClick={() => setOpen(true)} style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          + Add subtask
        </button>
      </div>
    );
  }

  return (
    <div className="subtask-add">
      <input
        autoFocus
        placeholder="Subtask..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) { onAdd(taskId, value.trim()); setValue(''); }
          if (e.key === 'Escape') { setOpen(false); setValue(''); }
        }}
        onBlur={() => { if (!value.trim()) setOpen(false); }}
      />
    </div>
  );
}
