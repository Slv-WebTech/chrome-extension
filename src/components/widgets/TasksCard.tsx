'use client';

import { Check, ListTodo, Pencil, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  MAX_TASK_LENGTH,
  type Priority,
  type Task,
  addTask,
  clearCompleted,
  removeTask,
  restoreTask,
  selectVisibleTasks,
  setTaskFilter,
  setTaskSort,
  toggleTask,
  updateTask,
} from '@/store/slices/tasks';
import { Button, Card, IconButton, Segmented, Select, TextInput } from '../ui/primitives';

export const TASK_INPUT_ID = 'task-input';

const PRIORITY_LABEL: Record<Priority, string> = { high: 'High', medium: 'Medium', low: 'Low' };
const PRIORITY_DOT: Record<Priority, string> = {
  high: 'bg-[#ef4444]',
  medium: 'bg-[#f59e0b]',
  low: 'bg-[#22c55e]',
};
const NEXT_PRIORITY: Record<Priority, Priority> = { high: 'medium', medium: 'low', low: 'high' };

function TaskRow({ task, index }: { task: Task; index: number }) {
  const dispatch = useAppDispatch();
  const all = useAppSelector((s) => s.tasks.items);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);

  const save = () => {
    dispatch(updateTask({ id: task.id, text: draft }));
    setEditing(false);
  };

  const remove = () => {
    const position = all.findIndex((t) => t.id === task.id);
    dispatch(removeTask(task.id));
    toast('Task deleted', {
      description: task.text,
      action: { label: 'Undo', onClick: () => dispatch(restoreTask({ task, index: position })) },
      duration: 6000,
    });
  };

  return (
    <li
      className="group glass-inner flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-accent-soft"
      style={{ animation: `fade-up 0.35s ${Math.min(index, 8) * 30}ms cubic-bezier(0.22,1,0.36,1) both` }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={`${task.done ? 'Mark as not done' : 'Mark as done'}: ${task.text}`}
        onClick={() => dispatch(toggleTask({ id: task.id }))}
        className={cn(
          'flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors',
          task.done ? 'border-transparent bg-accent text-accent-fg' : 'border-fg-muted/60 hover:border-accent-text',
        )}
      >
        {task.done && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
      </button>

      {editing ? (
        <form
          className="flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <TextInput
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setDraft(task.text);
                setEditing(false);
              }
            }}
            maxLength={MAX_TASK_LENGTH}
            aria-label="Edit task"
            className="h-8"
            autoFocus
          />
        </form>
      ) : (
        <span
          onDoubleClick={() => {
            setDraft(task.text);
            setEditing(true);
          }}
          className={cn('min-w-0 flex-1 text-sm leading-snug break-words text-fg', task.done && 'text-fg-muted line-through')}
        >
          {task.text}
        </span>
      )}

      <button
        type="button"
        onClick={() => dispatch(updateTask({ id: task.id, priority: NEXT_PRIORITY[task.priority] }))}
        aria-label={`Priority ${PRIORITY_LABEL[task.priority]}. Click to change`}
        title={`Priority: ${PRIORITY_LABEL[task.priority]} (click to change)`}
        className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-accent-soft"
      >
        <span className={cn('size-2.5 rounded-full', PRIORITY_DOT[task.priority])} aria-hidden />
      </button>
      <div className="flex shrink-0 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
        <IconButton
          label={`Edit task: ${task.text}`}
          size="sm"
          onClick={() => {
            setDraft(task.text);
            setEditing(true);
          }}
        >
          <Pencil className="size-3.5" aria-hidden />
        </IconButton>
        <IconButton label={`Delete task: ${task.text}`} size="sm" onClick={remove}>
          <Trash2 className="size-3.5 text-danger" aria-hidden />
        </IconButton>
      </div>
    </li>
  );
}

export function TasksCard({ maxVisible, compact = false }: { maxVisible?: number; compact?: boolean }) {
  const dispatch = useAppDispatch();
  const tasksState = useAppSelector((s) => s.tasks);
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');

  const visible = useMemo(() => selectVisibleTasks(tasksState), [tasksState]);
  const shown = maxVisible ? visible.slice(0, maxVisible) : visible;
  const total = tasksState.items.length;
  const done = tasksState.items.filter((t) => t.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    // An inline "!high" tag in the text overrides the dropdown.
    const hasTag = /(^|\s)!(high|medium|low|h|m|l|1|2|3)(\s|$)/i.test(text);
    dispatch(addTask(hasTag ? { text } : { text, priority }));
    setText('');
  };

  return (
    <Card
      id="tasks"
      title="Tasks"
      icon={<ListTodo className="size-4" aria-hidden />}
      actions={
        <span className="text-xs font-medium text-fg-muted tabular" aria-live="polite">
          {done}/{total} done
        </span>
      }
      className={cn(!compact && 'min-h-[16rem]')}
    >
      <form onSubmit={submit} className="flex gap-2" aria-label="Add task">
        <label htmlFor={TASK_INPUT_ID} className="sr-only">
          New task (add !high, !medium or !low to set priority)
        </label>
        <TextInput
          id={TASK_INPUT_ID}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task…"
          maxLength={MAX_TASK_LENGTH + 20}
          autoComplete="off"
        />
        <Select aria-label="New task priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-[5.6rem] shrink-0 px-2">
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
        <Button type="submit" variant="primary" aria-label="Add task" className="px-3">
          <Plus className="size-4" aria-hidden />
        </Button>
      </form>

      {total > 0 && !compact && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Segmented
            label="Filter tasks"
            value={tasksState.filter}
            onChange={(value) => dispatch(setTaskFilter(value))}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'done', label: 'Done' },
            ]}
          />
          <Select
            aria-label="Sort tasks"
            value={tasksState.sort}
            onChange={(e) => dispatch(setTaskSort(e.target.value as 'priority' | 'newest' | 'oldest'))}
            className="h-8 w-auto text-xs"
          >
            <option value="priority">By priority</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </Select>
        </div>
      )}

      <ul className="scroll-thin mt-3 max-h-72 flex-1 space-y-1.5 overflow-y-auto pr-0.5" aria-label="Task list">
        {shown.map((task, index) => (
          <TaskRow key={task.id} task={task} index={index} />
        ))}
      </ul>

      {total === 0 && (
        <p className="py-6 text-center text-sm text-fg-muted">Nothing to do yet — add your first task above.</p>
      )}
      {total > 0 && visible.length === 0 && <p className="py-6 text-center text-sm text-fg-muted">No {tasksState.filter} tasks.</p>}
      {maxVisible && visible.length > maxVisible && (
        <p className="mt-2 text-center text-xs text-fg-muted">+{visible.length - maxVisible} more on your dashboard</p>
      )}

      {total > 0 && (
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Tasks completed" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${percent}%` }} />
          </div>
          {done > 0 && (
            <button type="button" onClick={() => dispatch(clearCompleted())} className="cursor-pointer text-xs font-medium text-fg-muted hover:text-fg">
              Clear completed
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
