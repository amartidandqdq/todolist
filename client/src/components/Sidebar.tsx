import { useState } from 'react';
import { TaskList } from '../hooks/useTasks';

interface Props {
  lists: TaskList[];
  activeId: number;
  onSelect: (id: number) => void;
  onAdd: (name: string) => void;
  onDelete: (id: number) => void;
  taskCounts: Record<number, number>;
}

export default function Sidebar({ lists, activeId, onSelect, onAdd, onDelete, taskCounts }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
      setAdding(false);
    }
  };

  return (
    <nav className="sidebar">
      <h1>TodoList</h1>
      <ul className="sidebar-list">
        {lists.map((list) => (
          <li
            key={list.id}
            className={`sidebar-item ${list.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(list.id)}
          >
            <span className="sidebar-dot" style={{ background: list.color }} />
            <span>{list.name}</span>
            <span className="sidebar-count">{taskCounts[list.id] || 0}</span>
            {lists.length > 1 && (
              <button
                className="task-delete"
                style={{ opacity: list.id === activeId ? 1 : undefined }}
                onClick={(e) => { e.stopPropagation(); onDelete(list.id); }}
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
      {adding ? (
        <div style={{ padding: '8px 16px' }}>
          <input
            autoFocus
            placeholder="List name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            onBlur={() => { if (!name.trim()) setAdding(false); }}
          />
        </div>
      ) : (
        <div className="sidebar-add" onClick={() => setAdding(true)}>
          <span>+</span> New list
        </div>
      )}
    </nav>
  );
}
