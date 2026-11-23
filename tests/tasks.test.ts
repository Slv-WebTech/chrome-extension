import { describe, expect, it } from 'vitest';
import reducer, {
  addTask,
  clearCompleted,
  initialTasksState,
  parseTaskInput,
  removeTask,
  restoreTask,
  selectVisibleTasks,
  setTaskFilter,
  toggleTask,
  updateTask,
} from '@/store/slices/tasks';

describe('parseTaskInput', () => {
  it('extracts priority tags and trims whitespace', () => {
    expect(parseTaskInput('  Ship v2   !high ')).toEqual({ text: 'Ship v2', priority: 'high' });
    expect(parseTaskInput('!l water plants')).toEqual({ text: 'water plants', priority: 'low' });
    expect(parseTaskInput('call mom !2')).toEqual({ text: 'call mom', priority: 'medium' });
    expect(parseTaskInput('plain task')).toEqual({ text: 'plain task', priority: 'medium' });
  });

  it('does not treat exclamation marks inside words as tags', () => {
    expect(parseTaskInput('Wow!high is not a tag')).toEqual({ text: 'Wow!high is not a tag', priority: 'medium' });
  });

  it('caps the length', () => {
    expect(parseTaskInput('x'.repeat(500)).text).toHaveLength(200);
  });
});

describe('tasks reducer', () => {
  const add = (state = initialTasksState, text: string, now = 1) => reducer(state, addTask({ text }, now));

  it('adds, toggles, edits and removes tasks', () => {
    let state = add(undefined, 'Write tests !high');
    const id = state.items[0]!.id;
    expect(state.items[0]).toMatchObject({ text: 'Write tests', priority: 'high', done: false });

    state = reducer(state, toggleTask({ id, now: 99 }));
    expect(state.items[0]).toMatchObject({ done: true, completedAt: 99 });
    state = reducer(state, toggleTask({ id }));
    expect(state.items[0]).toMatchObject({ done: false, completedAt: null });

    state = reducer(state, updateTask({ id, text: '  Write MORE tests ', priority: 'low' }));
    expect(state.items[0]).toMatchObject({ text: 'Write MORE tests', priority: 'low' });
    state = reducer(state, updateTask({ id, text: '   ' }));
    expect(state.items[0]!.text).toBe('Write MORE tests');

    state = reducer(state, removeTask(id));
    expect(state.items).toHaveLength(0);
  });

  it('restores a deleted task at its old position (undo)', () => {
    let state = add(undefined, 'one');
    state = add(state, 'two', 2);
    state = add(state, 'three', 3);
    const two = state.items[1]!;
    state = reducer(state, removeTask(two.id));
    state = reducer(state, restoreTask({ task: two, index: 1 }));
    expect(state.items.map((t) => t.text)).toEqual(['one', 'two', 'three']);
    // idempotent
    expect(reducer(state, restoreTask({ task: two, index: 1 })).items).toHaveLength(3);
  });

  it('filters and sorts: pending first, by priority, then newest', () => {
    let state = add(undefined, 'low old !low', 1);
    state = add(state, 'high !high', 2);
    state = add(state, 'medium new', 3);
    state = add(state, 'done high !high', 4);
    state = reducer(state, toggleTask({ id: state.items[3]!.id }));

    expect(selectVisibleTasks(state).map((t) => t.text)).toEqual(['high', 'medium new', 'low old', 'done high']);
    expect(selectVisibleTasks(reducer(state, setTaskFilter('done'))).map((t) => t.text)).toEqual(['done high']);
    expect(selectVisibleTasks(reducer(state, setTaskFilter('active')))).toHaveLength(3);
  });

  it('clears completed tasks', () => {
    let state = add(undefined, 'a');
    state = add(state, 'b', 2);
    state = reducer(state, toggleTask({ id: state.items[0]!.id }));
    state = reducer(state, clearCompleted());
    expect(state.items.map((t) => t.text)).toEqual(['b']);
  });
});
