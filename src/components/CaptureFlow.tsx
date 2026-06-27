import { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { ArrowRight, User, Users, CalendarBlank, Inbox } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';

interface CaptureFlowProps {
  onCapture: (title: string, next_move: 'me' | 'external', committed: boolean) => void;
}

export function CaptureFlow({ onCapture }: CaptureFlowProps) {
  const [text, setText] = useState('');
  const [step, setStep] = useState<'input' | 'whose-move' | 'commit'>('input');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'input') {
      inputRef.current?.focus();
    }
  }, [step]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && text.trim()) {
      setStep('whose-move');
    }
  };

  const handleReset = () => {
    setText('');
    setStep('input');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div 
        layout
        className={cn(
          "relative overflow-hidden transition-colors duration-300",
          "bg-zinc-950 border rounded-xl",
          step !== 'input' ? "border-zinc-800" : "border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600"
        )}
      >
        
        {/* Input Area */}
        <div className="relative p-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            readOnly={step !== 'input'}
            placeholder="What's on your mind?"
            className={cn(
              "w-full bg-transparent py-4 px-4 sm:px-6 text-xl font-medium focus:outline-none transition-colors duration-300 placeholder:text-zinc-600",
              step !== 'input' ? "text-zinc-500" : "text-zinc-100"
            )}
          />
          <AnimatePresence>
            {step === 'input' && text.trim() && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setStep('whose-move')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-zinc-100 hover:bg-white text-zinc-950 rounded-md flex items-center justify-center transition-colors"
              >
                <ArrowRight size={20} weight="bold" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Transitioning Question Area */}
        <AnimatePresence mode="wait">
          {step !== 'input' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="p-4 sm:p-6 pt-0 border-t border-zinc-900 bg-zinc-950/50">
                
                {/* Whose Move Step */}
                {step === 'whose-move' && (
                  <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="space-y-4 pt-4"
                  >
                    <p className="text-sm font-medium text-zinc-400">Who is driving this right now?</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setStep('commit')}
                        className="group flex-1 p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 transition-colors flex items-center gap-4 text-left"
                      >
                        <div className="w-10 h-10 rounded-md bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors text-zinc-300">
                          <User size={20} weight="duotone" />
                        </div>
                        <span className="font-medium text-zinc-100">It's on me</span>
                      </button>
                      <button
                        onClick={() => {
                          onCapture(text.trim(), 'external', false);
                          handleReset();
                        }}
                        className="group flex-1 p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 transition-colors flex items-center gap-4 text-left"
                      >
                        <div className="w-10 h-10 rounded-md bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors text-zinc-300">
                          <Users size={20} weight="duotone" />
                        </div>
                        <span className="font-medium text-zinc-100">Waiting on someone</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Commit Step */}
                {step === 'commit' && (
                  <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="space-y-4 pt-4"
                  >
                    <p className="text-sm font-medium text-zinc-400">Are you doing this today?</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => {
                          onCapture(text.trim(), 'me', true);
                          handleReset();
                        }}
                        className="group flex-1 p-4 rounded-lg bg-zinc-100 hover:bg-white border border-transparent transition-colors flex items-center gap-4 text-left"
                      >
                        <div className="w-10 h-10 rounded-md bg-zinc-200/50 flex items-center justify-center text-zinc-950">
                          <CalendarBlank size={20} weight="fill" />
                        </div>
                        <span className="font-semibold text-zinc-950">Yes, committing</span>
                      </button>
                      <button
                        onClick={() => {
                          onCapture(text.trim(), 'me', false);
                          handleReset();
                        }}
                        className="group flex-1 p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 transition-colors flex items-center gap-4 text-left"
                      >
                        <div className="w-10 h-10 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-zinc-300 transition-colors">
                          <Inbox size={20} weight="duotone" />
                        </div>
                        <span className="font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">Just noting for later</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                <button 
                  onClick={handleReset} 
                  className="mt-4 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
