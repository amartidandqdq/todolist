import { useState } from 'react';
import { TaskList, ViewMode } from '../types';
import ListMenu from './ListMenu';
import ExportImport from './ExportImport';

interface Props {
  lists: TaskList[];
  activeListId: number;
  viewMode: ViewMode;
  onSelectList: (id: number) => void;
  onSelectView: (view: ViewMode) => void;
  onAdd: (name: string) => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  taskCounts: Record<number, number>;
  theme: string;
  onToggleTheme: () => void;
  onImported: () => void;
}

export default function Sidebar({ lists, activeListId, viewMode, onSelectList, onSelectView, onAdd, onRename, onDelete, taskCounts, theme, onToggleTheme, onImported }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (name.trim()) { onAdd(name.trim()); setName(''); setAdding(false); }
  };

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <span>Tasks</span>
        <button className="theme-toggle" onClick={onToggleTheme} title={isDark ? 'Light mode' : 'Dark mode'}>
          {isDark ? '\u2600' : '\u263E'}
        </button>
      </div>

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
            <ListMenu listId={list.id} listName={list.name} onRename={onRename} onDelete={onDelete} canDelete={lists.length > 1} />
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

      <div className="sidebar-section" style={{ marginTop: 'auto' }}>
        <ExportImport onImported={onImported} />
      </div>
    </nav>
  );
}
