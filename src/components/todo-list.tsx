'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
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
  const [nextId, setNextId] = useState(4); // Use consistent counter instead of Date.now()
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

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    void setStoredValue(TODO_STORAGE_KEY, todos);
  }, [todos, isHydrated]);

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, {
        id: nextId,
        text: newTodo.trim(),
        completed: false
      }]);
      setNextId(nextId + 1);
      setNewTodo('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const hasOverflow = todos.length > 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white/10 backdrop-blur-md border-white/20 rounded-2xl shadow-2xl hover:shadow-3xl transition-shadow duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-3 text-xl">
            <motion.svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </motion.svg>
            To-Do List
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Add new task..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              className="bg-white/20 border-white/30 text-white placeholder-gray-300 focus:bg-white/30 focus:border-white/50 transition-all duration-200"
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            />
            <Button
              size="sm"
              onClick={addTodo}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-3 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>

          <div
            className={`space-y-3 max-h-[156px] ${hasOverflow ? 'overflow-y-auto pr-2' : 'overflow-y-hidden'} scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent`}
          >
            <AnimatePresence>
              {todos.map((todo, index) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  layout
                  className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-1 transition-all duration-200 group hover:border-white/20 hover:bg-white/10"
                >
                  <motion.div
                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center"
                    whileTap={{ scale: 0.9 }}
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id)}
                      className="border-white/50"
                      style={{ backgroundColor: todo.completed ? '#22c55e' : 'transparent', borderColor: todo.completed ? '#22c55e' : 'rgba(255,255,255,0.5)' }}
                    />
                  </motion.div>
                  <span
                    className={`flex-1 self-center text-sm leading-5 transition-all duration-200 ${todo.completed
                      ? 'text-gray-400 line-through opacity-60'
                      : 'text-white'} truncate
                      }`}
                  >
                    {todo.text}
                  </span>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTodo(todo.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {todos.length === 0 && (
            <div className="text-center text-gray-400 py-4">
              No tasks yet. Add one above!
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}