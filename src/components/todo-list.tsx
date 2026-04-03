'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredValue, setStoredValue } from '../services/chrome-storage';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const TODO_STORAGE_KEY = 'dashboard_todos';

const defaultTodos: Todo[] = [
  { id: 1, text: 'Review Chrome extension design', completed: false },
  { id: 2, text: 'Update dashboard components', completed: true },
  { id: 3, text: 'Test weather widget functionality', completed: false },
];

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>(defaultTodos);
  const [newTodo, setNewTodo] = useState('');
  const [nextId, setNextId] = useState(4);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadTodos = async () => {
      const storedTodos = await getStoredValue<Todo[] | null>(TODO_STORAGE_KEY, null);
      if (!mounted) return;
      const initialTodos = Array.isArray(storedTodos) ? storedTodos : defaultTodos;
      setTodos(initialTodos);
      const maxId = initialTodos.reduce((max, todo) => Math.max(max, todo.id), 0);
      setNextId(maxId + 1);
      setIsHydrated(true);
    };
    loadTodos();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    void setStoredValue(TODO_STORAGE_KEY, todos);
  }, [todos, isHydrated]);

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: nextId, text: newTodo.trim(), completed: false }]);
      setNextId(nextId + 1);
      setNewTodo('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const completedCount = todos.filter(t => t.completed).length;
  const hasOverflow = todos.length > 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', boxShadow: '0 4px 10px rgba(34,197,94,0.3)' }}
            >
              <svg style={{ width: 13, height: 13, fill: 'white' }} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span style={{ color: 'white', fontWeight: 600, fontSize: '15px', letterSpacing: '0.01em' }}>Tasks</span>
          </div>
          {todos.length > 0 && (
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}
            >
              {completedCount} / {todos.length}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {todos.length > 0 && (
          <div className="mx-5 mb-4 h-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #22c55e, #10b981)' }}
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / todos.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        )}

        <div className="px-4 pb-4 space-y-2">
          {/* Input row */}
          <div className="flex gap-2 items-center mb-3">
            <div
              className="flex-1 flex items-center gap-2 rounded-xl px-3"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <svg style={{ width: 13, height: 13, fill: 'rgba(255,255,255,0.35)', flexShrink: 0 }} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                placeholder="Add a new task..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'white',
                  fontSize: '13px',
                  width: '100%',
                  padding: '10px 0',
                }}
              />
            </div>
            <motion.button
              onClick={addTodo}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              className="rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                width: 38,
                height: 38,
                background: 'linear-gradient(135deg, #22c55e, #10b981)',
                boxShadow: '0 4px 12px rgba(34,197,94,0.35)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <svg style={{ width: 16, height: 16, fill: 'white' }} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </motion.button>
          </div>

          {/* Todo items */}
          <div
            className={hasOverflow ? 'max-h-[168px] overflow-y-auto pr-0.5' : ''}
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}
          >
            <AnimatePresence>
              {todos.map((todo) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 16, height: 0 }}
                  transition={{ duration: 0.22 }}
                  layout
                  className="group mb-2"
                >
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                    style={{
                      background: todo.completed ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${todo.completed ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    {/* Circular checkbox */}
                    <motion.button
                      type="button"
                      onClick={() => toggleTodo(todo.id)}
                      whileTap={{ scale: 0.82 }}
                      className="flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-200"
                      style={{
                        width: 22,
                        height: 22,
                        background: todo.completed ? 'linear-gradient(135deg, #22c55e, #10b981)' : 'transparent',
                        border: `2px solid ${todo.completed ? '#22c55e' : 'rgba(255,255,255,0.3)'}`,
                        boxShadow: todo.completed ? '0 0 10px rgba(34,197,94,0.45)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {todo.completed && (
                        <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, fill: 'white', display: 'block' }}>
                          <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" />
                        </svg>
                      )}
                    </motion.button>

                    {/* Text */}
                    <span
                      className="flex-1 text-sm transition-all duration-300"
                      style={{
                        color: todo.completed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.88)',
                        textDecoration: todo.completed ? 'line-through' : 'none',
                        letterSpacing: '0.01em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {todo.text}
                    </span>

                    {/* Delete */}
                    <motion.button
                      onClick={() => deleteTodo(todo.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-150"
                      style={{
                        width: 24,
                        height: 24,
                        background: 'rgba(239,68,68,0.12)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        cursor: 'pointer',
                      }}
                    >
                      <svg style={{ width: 9, height: 9, fill: 'rgba(252,165,165,0.9)' }} viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {todos.length === 0 && (
              <div className="flex flex-col items-center py-6 gap-2">
                <svg style={{ width: 30, height: 30, fill: 'rgba(255,255,255,0.12)' }} viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h7a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: '13px' }}>No tasks yet</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
