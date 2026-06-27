import { useTrilist } from '../store/useTrilist';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { Clock, Check, Inbox, ArrowsClockwise, Hand, Warning } from '@phosphor-icons/react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function WatchList() {
  const { items, updateItem } = useTrilist();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const watchItems = items.filter(item => item.next_move === 'external');

  if (watchItems.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto py-20 text-center text-zinc-500">
        <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-lg mx-auto flex items-center justify-center mb-6">
          <Hand size={28} weight="duotone" />
        </div>
        <p className="font-medium text-zinc-300">Nothing to wait on</p>
        <p className="text-sm mt-1">You aren't waiting on anything right now.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 pb-20">
      <div className="flex items-baseline justify-between border-b border-zinc-800 pb-4 mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
          Watch
        </h2>
        <span className="text-xs font-mono bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded">
          {watchItems.length} items
        </span>
      </div>

      <div className="space-y-3">
        {watchItems.map(item => {
          const daysWaiting = differenceInDays(new Date(), item.watchSince || item.createdAt);
          const isStale = daysWaiting > 5;
          const isResolving = resolvingId === item.id;

          return (
            <div
              key={item.id}
              className={cn(
                "relative p-5 rounded-lg border transition-colors",
                isStale 
                  ? "bg-zinc-900/40 border-l-2 border-l-amber-500 border-t-zinc-800 border-r-zinc-800 border-b-zinc-800" 
                  : "bg-zinc-900/40 border-zinc-800"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                <div className="flex-1">
                  <h3 className="font-medium text-zinc-100 mb-1.5">{item.title}</h3>
                  {item.note && <p className="text-zinc-500 text-sm mb-3 leading-relaxed">{item.note}</p>}
                  
                  <div className="flex items-center gap-2 mt-3">
                    <span className={cn(
                      "text-xs font-medium flex items-center gap-1.5",
                      isStale ? "text-amber-500" : "text-zinc-500"
                    )}>
                      {isStale ? <Warning size={14} weight="bold" /> : <Clock size={14} weight="bold" />}
                      Waiting {formatDistanceToNow(item.watchSince || item.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  <AnimatePresence mode="wait">
                    {!isResolving ? (
                      <motion.button
                        key="resolve-btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setResolvingId(item.id)}
                        className="w-full sm:w-auto px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <ArrowsClockwise size={16} weight="bold" /> Resolve
                      </motion.button>
                    ) : (
                      <motion.div 
                        key="resolve-menu"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-md w-full sm:w-56"
                      >
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 px-1">
                          Action
                        </p>
                        <button
                          onClick={() => updateItem(item.id, { next_move: 'me', committed: true })}
                          className="px-3 py-2 text-sm font-medium bg-zinc-100 text-zinc-950 rounded hover:bg-white flex items-center gap-2 transition-colors text-left"
                        >
                          <Check size={16} weight="bold" /> Commit to it
                        </button>
                        <button
                          onClick={() => updateItem(item.id, { next_move: 'me', committed: false })}
                          className="px-3 py-2 text-sm font-medium bg-zinc-900 text-zinc-300 rounded hover:bg-zinc-800 flex items-center gap-2 transition-colors text-left"
                        >
                          <Inbox size={16} weight="bold" /> Not urgent
                        </button>
                        <button
                          onClick={() => setResolvingId(null)}
                          className="px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors text-left"
                        >
                          Cancel
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
