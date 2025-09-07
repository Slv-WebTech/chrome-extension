'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: 'Review Chrome extension design', completed: false },
    { id: 2, text: 'Update dashboard components', completed: true },
    { id: 3, text: 'Test weather widget functionality', completed: false }
  ]);
  const [newTodo, setNewTodo] = useState('');
  const [nextId, setNextId] = useState(4); // Use consistent counter instead of Date.now()

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

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 rounded-2xl shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-3">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          To-Do List
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add new task..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            className="bg-white/20 border-white/30 text-white placeholder-gray-300"
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          />
          <Button
            size="sm"
            onClick={addTodo}
            className="bg-green-500 hover:bg-green-600 px-3"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </Button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
            >
              <Checkbox
                checked={todo.completed}
                onCheckedChange={() => toggleTodo(todo.id)}
                className="border-white/50"
                style={{ backgroundColor: todo.completed ? '#22c55e' : 'transparent', borderColor: todo.completed ? '#22c55e' : 'rgba(255,255,255,0.5)' }}
              />
              <span
                className={`flex-1 text-sm ${todo.completed
                    ? 'text-gray-400 line-through'
                    : 'text-white'
                  }`}
              >
                {todo.text}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteTodo(todo.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1 h-8 w-8"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
          ))}
        </div>

        {todos.length === 0 && (
          <div className="text-center text-gray-400 py-6">
            No tasks yet. Add one above!
          </div>
        )}
      </CardContent>
    </Card>
  );
}