import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { FocusCard } from '@/components/widgets/FocusCard';
import { TasksCard } from '@/components/widgets/TasksCard';
import { makeStore } from '@/store';

function renderWithStore(ui: React.ReactElement) {
  const store = makeStore();
  const utils = render(<Provider store={store}>{ui}</Provider>);
  return { store, ...utils };
}

describe('TasksCard', () => {
  it('adds a task, honours inline priority tags, toggles and shows progress', () => {
    const { store } = renderWithStore(<TasksCard />);
    const input = screen.getByLabelText(/^New task \(/);

    fireEvent.change(input, { target: { value: 'Write docs !high' } });
    fireEvent.submit(input.closest('form')!);
    fireEvent.change(input, { target: { value: 'Relax' } });
    fireEvent.submit(input.closest('form')!);

    expect(store.getState().tasks.items.map((t) => [t.text, t.priority])).toEqual([
      ['Write docs', 'high'],
      ['Relax', 'medium'],
    ]);
    const list = screen.getByRole('list', { name: 'Task list' });
    expect(within(list).getAllByRole('listitem')[0]).toHaveTextContent('Write docs');

    fireEvent.click(screen.getByRole('checkbox', { name: /Write docs/ }));
    expect(screen.getByText('1/2 done')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Tasks completed' })).toHaveAttribute('aria-valuenow', '50');
  });

  it('does not add empty tasks', () => {
    const { store } = renderWithStore(<TasksCard />);
    const input = screen.getByLabelText(/^New task \(/);
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form')!);
    expect(store.getState().tasks.items).toHaveLength(0);
    expect(screen.getByText(/Nothing to do yet/)).toBeInTheDocument();
  });
});

describe('FocusCard', () => {
  it('starts and pauses the timer and exposes an accessible timer', () => {
    const { store } = renderWithStore(<FocusCard />);
    expect(screen.getByRole('timer', { name: /25:00 remaining, Focus/ })).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Start/ }));
    });
    expect(store.getState().focus.status).toBe('running');

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Pause/ }));
    });
    expect(store.getState().focus.status).toBe('paused');
    expect(screen.getByRole('button', { name: /Resume/ })).toBeInTheDocument();
  });
});
