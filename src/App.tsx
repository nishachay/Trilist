import { useState } from 'react';
import '@fontsource/geist-sans';
import { useTrilist } from './store/useTrilist';
import { CaptureFlow } from './components/CaptureFlow';
import { TodayRitual } from './components/TodayRitual';
import { TodoList } from './components/TodoList';
import { WatchList } from './components/WatchList';
import { LaterList } from './components/LaterList';
import { ListChecks, Clock, Inbox, CircleDashed } from '@phosphor-icons/react';
import { cn } from './lib/utils';

type ViewState = 'today' | 'todo' | 'watch' | 'later';

export default function App() {
  const [view, setView] = useState<ViewState>('today');
  const { items, addItem, todaySelection } = useTrilist();

  const handleCapture = (title: string, next_move: 'me' | 'external', committed: boolean) => {
    addItem(title, next_move, committed);
  };

  const todoCount = items.filter(i => i.next_move === 'me' && i.committed).length;
  const watchCount = items.filter(i => i.next_move === 'external').length;
  const laterCount = items.filter(i => i.next_move === 'me' && !i.committed).length;
  const todayCount = todaySelection.length;

  const NavItem = ({ 
    active, 
    onClick, 
    icon: Icon, 
    label, 
    count 
  }: { 
    active: boolean; 
    onClick: () => void; 
    icon: any; 
    label: string; 
    count: number 
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col sm:flex-row items-center gap-2 px-4 py-3 rounded-md transition-colors w-full sm:w-auto font-medium text-sm",
        active 
          ? "bg-zinc-100 text-zinc-950" 
          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50"
      )}
    >
      <Icon size={20} weight={active ? "fill" : "regular"} />
      <span>{label}</span>
      <span className={cn(
        "text-xs px-2 py-0.5 rounded-sm ml-auto sm:ml-2 font-mono",
        active ? "bg-zinc-200/50 text-zinc-950" : "bg-zinc-900 text-zinc-500"
      )}>
        {count}
      </span>
    </button>
  );

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans">
      
      {/* Header & Nav */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-foreground rounded flex items-center justify-center">
              <span className="text-background font-bold text-lg leading-none mt-px">T</span>
            </div>
            <span className="font-bold tracking-tight text-lg hidden sm:block">Trilist</span>
          </div>
          
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto hide-scrollbar">
            <NavItem active={view === 'today'} onClick={() => setView('today')} icon={CircleDashed} label="Today" count={todayCount} />
            <NavItem active={view === 'todo'} onClick={() => setView('todo')} icon={ListChecks} label="To-Do" count={todoCount} />
            <NavItem active={view === 'watch'} onClick={() => setView('watch')} icon={Clock} label="Watch" count={watchCount} />
            <NavItem active={view === 'later'} onClick={() => setView('later')} icon={Inbox} label="Later" count={laterCount} />
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-24">
        
        {items.length === 0 ? (
          /* Empty State Onboarding */
          <div className="max-w-2xl mx-auto text-center mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-100">
              Three lists.<br/>Zero context switching.
            </h1>
            <p className="text-lg text-zinc-400 max-w-lg mx-auto leading-relaxed">
              A minimalist system for getting things done. One list for what you're doing, one for what you're waiting on, and one for later.
            </p>
            
            <div className="pt-8">
              <CaptureFlow onCapture={handleCapture} />
            </div>
          </div>
        ) : (
          /* Normal App View */
          <div className="space-y-12">
            <div className="max-w-2xl mx-auto">
              <CaptureFlow onCapture={handleCapture} />
            </div>
            
            <div className="pt-8">
              {view === 'today' && <TodayRitual />}
              {view === 'todo' && <TodoList />}
              {view === 'watch' && <WatchList />}
              {view === 'later' && <LaterList />}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
