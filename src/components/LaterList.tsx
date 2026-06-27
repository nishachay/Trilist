import { useTrilist } from '../store/useTrilist';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, Trash, Check, X, Inbox } from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function LaterList() {
  const { items, updateItem, deleteItem } = useTrilist();

  const laterItems = items.filter(item => item.next_move === 'me' && !item.committed);
  
  const staleItems = laterItems.filter(item => differenceInDays(new Date(), item.lastTouched) > 14);
  const normalItems = laterItems.filter(item => differenceInDays(new Date(), item.lastTouched) <= 14);

  if (laterItems.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto py-20 text-center text-zinc-600">
        <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-lg mx-auto flex items-center justify-center mb-6 opacity-50">
          <Inbox size={28} weight="duotone" />
        </div>
        <p className="font-medium text-zinc-400">Nothing saved for later</p>
        <p className="text-sm mt-1">This list is intentionally quiet.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-12 pb-20">
      <div className="flex items-baseline justify-between border-b border-zinc-800 pb-4">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-400">Later</h2>
        <span className="text-xs font-mono bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded">
          {laterItems.length} items
        </span>
      </div>

      {staleItems.length > 0 && (
        <div className="space-y-4 mb-12">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-6">
            <h3 className="font-medium text-zinc-300 mb-2 flex items-center gap-2">
              <ArrowUpRight size={18} weight="bold" /> Routine Review
            </h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-lg leading-relaxed">
              These items have been sitting for over two weeks. Time to commit or let them go.
            </p>
            <div className="space-y-3">
              {staleItems.map(item => (
                <div key={item.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-md flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div>
                    <h4 className="font-medium text-zinc-100 mb-1">{item.title}</h4>
                    <span className="text-xs font-medium text-zinc-500">
                      Untouched for {formatDistanceToNow(item.lastTouched)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      onClick={() => updateItem(item.id, { committed: true })}
                      className="px-3 py-1.5 bg-zinc-100 text-zinc-950 text-sm font-semibold rounded hover:bg-white flex items-center gap-1.5 transition-colors"
                    >
                      <Check size={14} weight="bold" /> Commit
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="px-3 py-1.5 bg-zinc-900 text-zinc-300 text-sm font-medium rounded hover:bg-zinc-800 flex items-center gap-1.5 transition-colors"
                    >
                      <X size={14} weight="bold" /> Let go
                    </button>
                    <button
                      onClick={() => updateItem(item.id, {})} 
                      className="px-3 py-1.5 text-zinc-500 text-sm font-medium hover:text-zinc-300 transition-colors"
                    >
                      Keep
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {normalItems.length > 0 && (
        <div className="space-y-2 opacity-70 hover:opacity-100 transition-opacity duration-500">
          {normalItems.map((item, i) => (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              key={item.id}
              className="group flex items-center justify-between p-3 rounded-lg hover:bg-zinc-900/50 transition-colors"
            >
              <div className="flex-1">
                <h3 className="text-zinc-400 font-medium group-hover:text-zinc-200 transition-colors">{item.title}</h3>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => updateItem(item.id, { committed: true })}
                  className="px-3 py-1 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-100 rounded transition-colors"
                >
                  Commit
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                  title="Delete"
                >
                  <Trash size={14} weight="bold" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
