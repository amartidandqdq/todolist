import { useState } from 'react';

interface Props {
  listId: number;
  listName: string;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  canDelete: boolean;
}

export default function ListMenu({ listId, listName, onRename, onDelete, canDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(listName);

  if (renaming) {
    return (
      <input autoFocus className="list-rename-input" value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim()) { onRename(listId, name.trim()); setRenaming(false); }
          if (e.key === 'Escape') setRenaming(false);
        }}
        onBlur={() => { if (name.trim() && name !== listName) onRename(listId, name.trim()); setRenaming(false); }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div className="list-menu-wrapper" onClick={(e) => e.stopPropagation()}>
      <button className="list-menu-btn" onClick={() => setOpen(!open)}>&#x22EE;</button>
      {open && (
        <div className="list-menu-dropdown">
          <button onClick={() => { setRenaming(true); setOpen(false); }}>Rename</button>
          {canDelete && <button className="danger" onClick={() => { onDelete(listId); setOpen(false); }}>Delete list</button>}
        </div>
      )}
    </div>
  );
}
