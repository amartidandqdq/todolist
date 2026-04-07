import { useState } from 'react';
import { Task } from '../hooks/useTasks';

interface Props {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onClick: (task: Task) => void;
  onAddSubtask: (parentId: number, title: string) => void;
}

function formatDate(d: string | null): string | null {
  if (!d) return null;
  const date = new Date(d + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = date.getTime() - today.getTime();
  const days = Math.round(diff / 86400000);

  if (days < 0) return `Overdue (${date.toLocaleDateString()})`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return date.toLocaleDateString();
}

function recurrenceLabel(rule: string | null): string | null {
  if (!rule) return null;
  try {
    const r = JSON.parse(rule);
    const interval = r.interval || 1;
    if (interval === 1) return r.freq.charAt(0).toUpperCase() + r.freq.slice(1);
    return `Every ${interval} ${r.freq.replace('ly', '')}s`;
  } catch { return null; }
}

export default function TaskItem({ task, onToggle, onDelete, onClick, onAddSubtask }: Props) {
  const [subInput, setSubInput] = useState('');
  const [showSubInput, setShowSubInput] = useState(false);

  const dateStr = formatDate(task.due_date);
  const isOverdue = dateStr?.startsWith('Overdue');
  const recLabel = recurrenceLabel(task.recurrence_rule);

  return (
    <div>
      <div className={`task-item ${task.completed ? 'completed' : ''}`}>
        <div
          className={`task-checkbox ${task.completed ? 'checked' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
        />
        <div className="task-content" onClick={() => onClick(task)}>
          <div className="task-title">{task.title}</div>
          {(dateStr || recLabel || (task.subtasks && task.subtasks.length > 0)) && (
            <div className="task-meta">
              {dateStr && <span className={isOverdue ? 'overdue' : ''}>{dateStr}</span>}
              {recLabel && <span className="recurrence">{recLabel}</span>}
              {task.subtasks && task.subtasks.length > 0 && (
                <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks</span>
              )}
            </div>
          )}
        </div>
        <button className="task-delete" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>×</button>
      </div>

      {/* Subtasks */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="subtasks">
          {task.subtasks.map((sub) => (
            <div key={sub.id} className={`task-item ${sub.completed ? 'completed' : ''}`}>
              <div
                className={`task-checkbox ${sub.completed ? 'checked' : ''}`}
                onClick={() => onToggle(sub.id)}
              />
              <div className="task-content">
                <div className="task-title">{sub.title}</div>
              </div>
              <button className="task-delete" onClick={() => onDelete(sub.id)}>×</button>
            </div>
          ))}
        </div>
      )}

      {!task.completed && (
        showSubInput ? (
          <div className="subtask-add">
            <input
              autoFocus
              placeholder="Subtask..."
              value={subInput}
              onChange={(e) => setSubInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && subInput.trim()) {
                  onAddSubtask(task.id, subInput.trim());
                  setSubInput('');
                }
                if (e.key === 'Escape') { setShowSubInput(false); setSubInput(''); }
              }}
              onBlur={() => { if (!subInput.trim()) setShowSubInput(false); }}
            />
          </div>
        ) : (
          <div className="subtask-add">
            <button onClick={() => setShowSubInput(true)} style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              + Add subtask
            </button>
          </div>
        )
      )}
    </div>
  );
}
