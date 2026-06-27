import { useState } from 'react';
import { useTrilist } from '../store/useTrilist';
import { format } from 'date-fns';
import { CheckCircle, Plus, Archive, WarningCircle, X } from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function TodayRitual() {
  const { items, antiTodos, todaySelection, toggleTodaySelection, addAntiTodo, archiveDay } = useTrilist();
  const [antiTodoText, setAntiTodoText] = useState('');
  const [isAddingAntiTodo, setIsAddingAntiTodo] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const todoItems = items.filter(item => item.next_move === 'me' && item.committed);
  const selectedItems = todoItems.filter(item => todaySelection.includes(item.id));
  const unselectedItems = todoItems.filter(item => !todaySelection.includes(item.id));

  const handleAddAntiTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (antiTodoText.trim()) {
      addAntiTodo(antiTodoText.trim());
      setAntiTodoText('');
      setIsAddingAntiTodo(false);
    }
  };

  const isOverLimit = todaySelection.length > 5;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-12 pb-24">
      <div className="flex justify-between items-baseline border-b border-zinc-800 pb-4">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Today</h2>
        <p className="text-zinc-500 font-medium text-sm">{format(new Date(), 'EEEE, MMMM do')}</p>
      </div>

      {/* Selected Items for Today */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
            The Daily 3-5
            <span className="text-xs font-mono bg-zinc-900 text-zinc-300 px-1.5 py-0.5 rounded">
              {todaySelection.length}
            </span>
          </h3>
          {isOverLimit && (
            <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
              <WarningCircle size={14} weight="fill" />
              <span>More than 5 items selected</span>
            </div>
          )}
        </div>
        
        {selectedItems.length === 0 ? (
          <div className="border border-dashed border-zinc-800 p-8 rounded-lg text-center">
            <p className="text-zinc-500 text-sm">
              No items picked for today. Select some from your To-Do list below.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {selectedItems.map(item => (
              <li key={item.id} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg flex justify-between items-center group hover:border-zinc-700 transition-colors">
                <span className="font-medium text-zinc-100">{item.title}</span>
                <button
                  onClick={() => toggleTodaySelection(item.id)}
                  className="w-6 h-6 flex items-center justify-center rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove from Today"
                >
                  <X size={14} weight="bold" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Picker from To-Do */}
      {unselectedItems.length > 0 && (
        <section className="space-y-3 pt-4 border-t border-zinc-900">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Available To-Do</h4>
          <div className="flex flex-wrap gap-2">
            {unselectedItems.map(item => (
              <button
                key={item.id}
                onClick={() => toggleTodaySelection(item.id)}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center gap-2"
              >
                <Plus size={12} weight="bold" />
                {item.title}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Anti-Todo Log */}
      <section className="space-y-4 pt-12 border-t border-zinc-900">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
            Anti-Todo Log
            <span className="text-xs font-mono bg-zinc-900 text-zinc-300 px-1.5 py-0.5 rounded">
              {antiTodos.length}
            </span>
          </h3>
          {!isAddingAntiTodo && (
            <button
              onClick={() => setIsAddingAntiTodo(true)}
              className="text-xs font-medium flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <Plus size={12} weight="bold" /> Log a win
            </button>
          )}
        </div>

        {isAddingAntiTodo && (
          <form onSubmit={handleAddAntiTodo} className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={antiTodoText}
              onChange={(e) => setAntiTodoText(e.target.value)}
              placeholder="What did you get done?"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600 text-zinc-100"
            />
            <button type="submit" className="bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-2 rounded-md text-sm font-semibold transition-colors">
              Log
            </button>
            <button
              type="button"
              onClick={() => setIsAddingAntiTodo(false)}
              className="text-zinc-500 px-2 text-sm hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          </form>
        )}

        <div className="flex flex-col gap-2">
          {antiTodos.length === 0 ? (
            <p className="text-sm text-zinc-600">No wins logged yet today.</p>
          ) : (
            antiTodos.map(todo => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={todo.id}
                className="flex items-center gap-3 text-sm font-medium text-zinc-300"
              >
                <CheckCircle size={16} weight="fill" className="text-zinc-500" />
                {todo.content}
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* End of Day Action */}
      <section className="pt-16 border-t border-zinc-900">
        {showArchiveConfirm ? (
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 text-left space-y-4">
            <h4 className="font-semibold text-zinc-100">Wrap up the day?</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">
              This will clear your selected tasks and your Anti-Todo log, preparing a clean slate for tomorrow. Selected tasks will be permanently removed from your To-Do list.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  archiveDay();
                  setShowArchiveConfirm(false);
                }}
                className="px-4 py-2 rounded-md bg-zinc-100 text-zinc-950 text-sm font-semibold hover:bg-white transition-colors"
              >
                Archive Day
              </button>
              <button
                onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 rounded-md bg-transparent text-zinc-400 text-sm font-medium hover:text-zinc-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowArchiveConfirm(true)}
            className="group flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors font-medium text-sm"
          >
            <Archive size={16} />
            End of Day Wrap-Up
          </button>
        )}
      </section>
    </div>
  );
}
