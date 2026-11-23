import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { uid } from '@/lib/utils';

export type Priority = 'high' | 'medium' | 'low';
export type TaskFilter = 'all' | 'active' | 'done';
export type TaskSort = 'priority' | 'newest' | 'oldest';

export interface Task {
  id: string;
  text: string;
  priority: Priority;
  done: boolean;
  createdAt: number;
  completedAt: number | null;
}

export interface TasksState {
  items: Task[];
  filter: TaskFilter;
  sort: TaskSort;
}

export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
export const MAX_TASK_LENGTH = 200;
export const MAX_TASKS = 500;

export const initialTasksState: TasksState = { items: [], filter: 'all', sort: 'priority' };

/** "Pay rent !high" / "!l read" → { text, priority } (last `!h|m|l|high|medium|low|1|2|3` token wins). */
export function parseTaskInput(raw: string): { text: string; priority: Priority } {
  let priority: Priority = 'medium';
  const text = raw
    .replace(/(^|\s)!(high|medium|low|h|m|l|1|2|3)(?=\s|$)/gi, (_match, lead: string, level: string) => {
      const l = level.toLowerCase();
      priority = l === 'h' || l === 'high' || l === '1' ? 'high' : l === 'l' || l === 'low' || l === '3' ? 'low' : 'medium';
      return lead;
    })
    .replace(/\s+/g, ' ')
    .trim();
  return { text: text.slice(0, MAX_TASK_LENGTH), priority };
}

export function selectVisibleTasks(state: TasksState): Task[] {
  const filtered = state.items.filter((task) =>
    state.filter === 'all' ? true : state.filter === 'active' ? !task.done : task.done,
  );
  const sorted = [...filtered];
  sorted.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (state.sort === 'priority' && a.priority !== b.priority) return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    return state.sort === 'oldest' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
  });
  return sorted;
}

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: initialTasksState,
  reducers: {
    addTask: {
      reducer(state, action: PayloadAction<Task>) {
        if (state.items.length >= MAX_TASKS) return;
        state.items.push(action.payload);
      },
      prepare(input: { text: string; priority?: Priority }, now: number = Date.now()) {
        const parsed = parseTaskInput(input.text);
        const task: Task = {
          id: uid(),
          text: parsed.text,
          priority: input.priority ?? parsed.priority,
          done: false,
          createdAt: now,
          completedAt: null,
        };
        return { payload: task };
      },
    },
    toggleTask(state, action: PayloadAction<{ id: string; now?: number }>) {
      const task = state.items.find((t) => t.id === action.payload.id);
      if (!task) return;
      task.done = !task.done;
      task.completedAt = task.done ? (action.payload.now ?? Date.now()) : null;
    },
    updateTask(state, action: PayloadAction<{ id: string; text?: string; priority?: Priority }>) {
      const task = state.items.find((t) => t.id === action.payload.id);
      if (!task) return;
      if (action.payload.text !== undefined) {
        const text = action.payload.text.replace(/\s+/g, ' ').trim().slice(0, MAX_TASK_LENGTH);
        if (text) task.text = text;
      }
      if (action.payload.priority) task.priority = action.payload.priority;
    },
    removeTask(state, action: PayloadAction<string>) {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
    restoreTask(state, action: PayloadAction<{ task: Task; index: number }>) {
      if (state.items.some((t) => t.id === action.payload.task.id)) return;
      state.items.splice(Math.min(action.payload.index, state.items.length), 0, action.payload.task);
    },
    clearCompleted(state) {
      state.items = state.items.filter((t) => !t.done);
    },
    setTaskFilter(state, action: PayloadAction<TaskFilter>) {
      state.filter = action.payload;
    },
    setTaskSort(state, action: PayloadAction<TaskSort>) {
      state.sort = action.payload;
    },
  },
});

export const { addTask, toggleTask, updateTask, removeTask, restoreTask, clearCompleted, setTaskFilter, setTaskSort } =
  tasksSlice.actions;
export default tasksSlice.reducer;
