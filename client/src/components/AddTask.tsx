import { useState, memo, useRef } from 'react';

interface Props {
  onAdd: (title: string) => void;
}

export default memo(function AddTask({ onAdd }: Props) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (title.trim()) { onAdd(title.trim()); setTitle(''); }
  };

  return (
    <div className="add-task">
      <div className="add-task-row" onClick={() => inputRef.current?.focus()}>
        <span className="icon">+</span>
        <input ref={inputRef} placeholder="Add a task"
          value={title} onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        />
      </div>
    </div>
  );
});
