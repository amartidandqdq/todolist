import { useState, useRef } from 'react';

interface Props {
  value: string;
  onChange: (q: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open && !value) {
    return (
      <button className="search-toggle" onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}>
        &#x1F50D;
      </button>
    );
  }

  return (
    <div className="search-bar">
      <span>&#x1F50D;</span>
      <input ref={inputRef} placeholder="Search tasks..." value={value}
        onChange={(e) => onChange(e.target.value)} autoFocus
        onBlur={() => { if (!value) setOpen(false); }}
        onKeyDown={(e) => { if (e.key === 'Escape') { onChange(''); setOpen(false); } }}
      />
      {value && <button onClick={() => { onChange(''); inputRef.current?.focus(); }}>&#x2715;</button>}
    </div>
  );
}
