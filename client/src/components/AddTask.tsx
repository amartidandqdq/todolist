import { useState } from 'react';

interface Props {
  onAdd: (title: string) => void;
}

export default function AddTask({ onAdd }: Props) {
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('');
    }
  };

  return (
    <div className="add-task">
      <div className="add-task-input">
        <input
          placeholder="Add a task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button className="add-task-btn" onClick={handleSubmit}>Add</button>
      </div>
    </div>
  );
}
