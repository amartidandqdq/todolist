import { useState, memo, useCallback } from 'react';

interface Props {
  onAdd: (title: string) => void;
}

export default memo(function AddTask({ onAdd }: Props) {
  const [title, setTitle] = useState('');

  const handleSubmit = useCallback(() => {
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('');
    }
  }, [title, onAdd]);

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
});
