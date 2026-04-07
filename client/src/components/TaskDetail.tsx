import { useState, useEffect } from 'react';
import { Task } from '../types';

interface Props {
  task: Task;
  onClose: () => void;
  onSave: (id: number, data: Partial<Task>) => void;
  onDelete: (id: number) => void;
}

const REPEAT_FREQ = [
  { label: 'Day', value: 'daily' },
  { label: 'Week', value: 'weekly' },
  { label: 'Month', value: 'monthly' },
  { label: 'Year', value: 'yearly' },
];

export default function TaskDetail({ task, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || '');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [dueTime, setDueTime] = useState(task.due_time || '');
  const [repeatOn, setRepeatOn] = useState(!!task.recurrence_rule);
  const [freq, setFreq] = useState('daily');
  const [interval, setInterval] = useState(1);

  useEffect(() => {
    setTitle(task.title);
    setNotes(task.notes || '');
    setDueDate(task.due_date || '');
    setDueTime(task.due_time || '');
    if (task.recurrence_rule) {
      try {
        const r = JSON.parse(task.recurrence_rule);
        setRepeatOn(true); setFreq(r.freq || 'daily'); setInterval(r.interval || 1);
      } catch { setRepeatOn(false); }
    } else { setRepeatOn(false); }
  }, [task]);

  const handleSave = () => {
    const recurrence = repeatOn ? JSON.stringify({ freq, interval }) : null;
    onSave(task.id, {
      title, notes,
      due_date: dueDate || null,
      due_time: dueTime || null,
      recurrence_rule: recurrence,
    } as Partial<Task>);
    onClose();
  };

  const completedDate = task.completed_at ? new Date(task.completed_at).toLocaleDateString() : null;

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          {task.completed ? `Completed ${completedDate || ''}` : 'Edit task'}
        </span>
        <button onClick={onClose}>&#x2715;</button>
      </div>

      <div className="detail-body">
        <div className="detail-field">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }} />
        </div>

        <div className="detail-field">
          <label>Details</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Add details" />
        </div>

        <div className="detail-field">
          <label>Date/time</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ flex: 1 }} />
            <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} style={{ width: 120 }} />
          </div>
        </div>

        <div className="detail-field">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={repeatOn} onChange={(e) => setRepeatOn(e.target.checked)}
              style={{ width: 'auto' }} />
            Repeat
          </label>
          {repeatOn && (
            <div className="repeat-options">
              <div className="repeat-row">
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Every</span>
                <input type="number" min={1} max={99} value={interval}
                  onChange={(e) => setInterval(Math.max(1, Number(e.target.value)))} />
                <select value={freq} onChange={(e) => setFreq(e.target.value)}>
                  {REPEAT_FREQ.map((f) => (
                    <option key={f.value} value={f.value}>{interval > 1 ? f.label + 's' : f.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="detail-actions">
        <button className="save-btn" onClick={handleSave}>Save</button>
        <button className="delete-btn" onClick={() => { onDelete(task.id); onClose(); }}>&#x1F5D1;</button>
      </div>
    </div>
  );
}
