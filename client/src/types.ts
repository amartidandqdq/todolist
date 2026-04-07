export interface Task {
  id: number;
  list_id: number;
  parent_id: number | null;
  title: string;
  notes: string;
  due_date: string | null;
  completed: number;
  completed_at: string | null;
  position: number;
  recurrence_rule: string | null;
  created_at: string;
  updated_at: string;
  subtasks?: Task[];
}

export interface TaskList {
  id: number;
  name: string;
  color: string;
  position: number;
  created_at: string;
}
