import { useTrilist } from '../store/useTrilist';
import { formatDistanceToNow } from 'date-fns';
import { Circle, DotsThreeVertical, Stack } from '@phosphor-icons/react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function TodoList() {
  const { items, updateItem, todaySelection } = useTrilist();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const todoItems = items.filter(item => item.next_move === 'me' && item.committed);

  if (todoItems.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto py-20 text-center text-zinc-500">
        <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-lg mx-auto flex items-center justify-center mb-6">
          <Stack size={28} weight="duotone" />
        </div>
        <p className="font-medium text-zinc-300">You're all caught up!</p>
        <p className="text-sm mt-1">Your To-Do list is completely empty.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 pb-20">
      <div className="flex items-baseline justify-between border-b border-zinc-800 pb-4 mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">To-Do</h2>
        <span className="text-xs font-mono bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded">
          {todoItems.length} items
        </span>
      </div>

      <div className="space-y-3">
        {todoItems.map((item, i) => {
          const isToday = todaySelection.includes(item.id);
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.5) }}
              key={item.id}
              className={cn(
                "group flex items-start justify-between p-4 rounded-lg border transition-colors",
                isToday 
                  ? "border-zinc-700 bg-zinc-900/80" 
                  : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
              )}
            >
              <div className="flex items-start gap-3 flex-1">
                <button
                  onClick={() => updateItem(item.id, { committed: false })} 
                  className="mt-1 text-zinc-500 hover:text-zinc-100 transition-colors flex-shrink-0"
                  title="Move to Later"
                >
                  <Circle size={20} weight="bold" />
                </button>
                <div className="flex-1">
                  <h3 className={cn(
                    "font-medium leading-tight mb-1 transition-colors",
                    isToday ? "text-zinc-100" : "text-zinc-300 group-hover:text-zinc-100"
                  )}>
                    {item.title}
                  </h3>
                  {item.note && (
                    <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed mb-2">
                      {item.note}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                    <span>{formatDistanceToNow(item.createdAt)} ago</span>
                    {isToday && (
                      <span className="text-zinc-100 bg-zinc-800 px-1.5 py-0.5 rounded-sm font-medium">
                        Today
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative ml-4">
                <button
                  onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                  className="text-zinc-500 hover:text-zinc-100 p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
                >
                  <DotsThreeVertical size={20} weight="bold" />
                </button>

                {openMenuId === item.id && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-950 border border-zinc-800 rounded-md shadow-lg overflow-hidden z-10 p-1">
                    <button
                      onClick={() => {
                        updateItem(item.id, { next_move: 'external' });
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium rounded-sm hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100 transition-colors"
                    >
                      Wait on someone
                    </button>
                    <button
                      onClick={() => {
                        updateItem(item.id, { committed: false });
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium rounded-sm hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100 transition-colors"
                    >
                      Not today (Later)
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
