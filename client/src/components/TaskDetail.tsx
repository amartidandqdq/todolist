import { useState, useEffect } from 'react';
import { Task } from '../hooks/useTasks';

interface Props {
  task: Task;
  onClose: () => void;
  onSave: (id: number, data: Partial<Task>) => void;
}

const RECURRENCE_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'Daily', value: '{"freq":"daily","interval":1}' },
  { label: 'Weekly', value: '{"freq":"weekly","interval":1}' },
  { label: 'Monthly', value: '{"freq":"monthly","interval":1}' },
  { label: 'Every 2 weeks', value: '{"freq":"weekly","interval":2}' },
];

export default function TaskDetail({ task, onClose, onSave }: Props) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || '');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [recurrence, setRecurrence] = useState(task.recurrence_rule || '');

  useEffect(() => {
    setTitle(task.title);
    setNotes(task.notes || '');
    setDueDate(task.due_date || '');
    setRecurrence(task.recurrence_rule || '');
  }, [task]);

  const handleSave = () => {
    onSave(task.id, {
      title,
      notes,
      due_date: dueDate || null,
      recurrence_rule: recurrence || null,
    } as Partial<Task>);
    onClose();
  };

  return (
    <div className="detail-panel">
      <button className="detail-close" onClick={onClose}>×</button>
      <h3>Task Details</h3>

      <div>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div>
        <label>Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div>
        <label>Due date</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>

      <div>
        <label>Recurrence</label>
        <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
          {RECURRENCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <button className="detail-save" onClick={handleSave}>Save</button>
    </div>
  );
}
