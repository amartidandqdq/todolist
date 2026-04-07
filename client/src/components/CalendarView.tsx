import { useMemo, useState } from 'react';
import { Task } from '../types';

interface Props {
  tasks: Task[];
  onSelectDate: (date: string) => void;
}

export default function CalendarView({ tasks, onSelectDate }: Props) {
  const [offset, setOffset] = useState(0);

  const today = new Date();
  const month = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const startDay = new Date(year, monthIdx, 1).getDay();

  const tasksByDate = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t) => {
      if (t.due_date && !t.completed) {
        map[t.due_date] = (map[t.due_date] || 0) + 1;
      }
    });
    return map;
  }, [tasks]);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(<div key={`e${i}`} className="cal-cell empty" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const count = tasksByDate[dateStr] || 0;
    const isToday = dateStr === todayStr;
    cells.push(
      <div key={d} className={`cal-cell ${isToday ? 'today' : ''} ${count ? 'has-tasks' : ''}`}
        onClick={() => onSelectDate(dateStr)}>
        <span>{d}</span>
        {count > 0 && <span className="cal-dot" />}
      </div>
    );
  }

  return (
    <div className="calendar-view">
      <div className="cal-header">
        <button onClick={() => setOffset(offset - 1)}>&#x25C0;</button>
        <span>{monthNames[monthIdx]} {year}</span>
        <button onClick={() => setOffset(offset + 1)}>&#x25B6;</button>
      </div>
      <div className="cal-days">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="cal-day-label">{d}</div>)}
      </div>
      <div className="cal-grid">{cells}</div>
    </div>
  );
}
