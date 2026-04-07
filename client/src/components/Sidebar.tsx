import { useState } from 'react';
import { TaskList, ViewMode } from '../types';

interface Props {
  lists: TaskList[];
  activeListId: number;
  viewMode: ViewMode;
  onSelectList: (id: number) => void;
  onSelectView: (view: ViewMode) => void;
  onAdd: (name: string) => void;
  onDelete: (id: number) => void;
  taskCounts: Record<number, number>;
}

export default function Sidebar({ lists, activeListId, viewMode, onSelectList, onSelectView, onAdd, onDelete, taskCounts }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (name.trim()) { onAdd(name.trim()); setName(''); setAdding(false); }
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-header">Tasks</div>

      <div className="sidebar-section">
        <div className={`sidebar-item ${viewMode === 'starred' ? 'active' : ''}`} onClick={() => onSelectView('starred')}>
          <span className="icon">&#9733;</span>
          <span className="label">Starred</span>
        </div>
      </div>

      <div className="sidebar-section">
        {lists.map((list) => (
          <div key={list.id}
            className={`sidebar-item ${viewMode === 'list' && list.id === activeListId ? 'active' : ''}`}
            onClick={() => { onSelectList(list.id); onSelectView('list'); }}
          >
            <span className="sidebar-dot" style={{ background: list.color }} />
            <span className="label">{list.name}</span>
            <span className="count">{taskCounts[list.id] || ''}</span>
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        {adding ? (
          <div style={{ padding: '4px 16px' }}>
            <input autoFocus placeholder="New list" value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
              onBlur={() => { if (!name.trim()) setAdding(false); }}
              style={{ fontSize: 13, padding: '6px 10px' }}
            />
          </div>
        ) : (
          <div className="sidebar-add" onClick={() => setAdding(true)}>
            <span className="icon">+</span>
            <span>Create new list</span>
          </div>
        )}
      </div>
    </nav>
  );
}
