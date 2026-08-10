import { useEffect } from "react";
import type { Task, ListKey, PriorityLevel } from "@/types";

interface KeyboardShortcutsParams {
  showHelp: boolean;
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>;
  menuOpen: boolean;
  showOnboarding: boolean;
  visibleTasks: Task[];
  focusedIdx: number | null;
  setFocusedIdx: React.Dispatch<React.SetStateAction<number | null>>;
  activeTab: ListKey;
  switchTab: (tab: ListKey) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  resolveTask: (id: string) => void;
  cycleTaskPriority: (id: string) => void;
  setTaskPriority: (id: string, p?: PriorityLevel) => void;
  setActionMenuTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  setPriorityPopoverTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setInput: (val: string) => void;
}

export const useKeyboardShortcuts = ({
  showHelp,
  setShowHelp,
  menuOpen,
  showOnboarding,
  visibleTasks,
  focusedIdx,
  setFocusedIdx,
  activeTab,
  switchTab,
  toggleTask,
  deleteTask,
  resolveTask,
  cycleTaskPriority,
  setActionMenuTaskId,
  setPriorityPopoverTaskId,
  inputRef,
  setInput,
}: KeyboardShortcutsParams) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA";

      if (e.key === "Escape") {
        if (showHelp) { setShowHelp(false); return; }
        if (menuOpen) return;
        if (isInput) {
          (activeEl as HTMLElement).blur();
          setInput("");
          return;
        }
        setActionMenuTaskId(null);
        setPriorityPopoverTaskId(null);
        setFocusedIdx(null);
        return;
      }

      if (isInput || showHelp || showOnboarding) return;

      if (e.key === "0") { switchTab("rough"); return; }
      if (e.key === "1") { switchTab("todo");  return; }
      if (e.key === "2") { switchTab("watch"); return; }
      if (e.key === "3") { switchTab("later"); return; }
      if (e.key === "?") { setShowHelp(true);  return; }
      if (e.key === "/") {
        e.preventDefault();
        setInput("/");
        requestAnimationFrame(() => inputRef.current?.focus());
        return;
      }

      if (visibleTasks.length > 0) {
        if (e.key === "j" || e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedIdx(i => i === null ? 0 : Math.min(i + 1, visibleTasks.length - 1));
          return;
        }
        if (e.key === "k" || e.key === "ArrowUp") {
          e.preventDefault();
          setFocusedIdx(i => i === null ? visibleTasks.length - 1 : Math.max(i - 1, 0));
          return;
        }
        if (e.key === " " && focusedIdx !== null && visibleTasks[focusedIdx]) {
          e.preventDefault();
          const target = visibleTasks[focusedIdx];
          if (activeTab === "watch") {
            resolveTask(target.id);
          } else if (activeTab === "rough") {
            deleteTask(target.id);
          } else {
            toggleTask(target.id);
          }
          return;
        }
        if ((e.key === "x" || e.key === "d") && focusedIdx !== null && visibleTasks[focusedIdx]) {
          e.preventDefault();
          const target = visibleTasks[focusedIdx];
          if (activeTab === "watch") {
            resolveTask(target.id);
          } else {
            deleteTask(target.id);
          }
          return;
        }
        if (e.key === "p" && focusedIdx !== null && visibleTasks[focusedIdx]) {
          e.preventDefault();
          const target = visibleTasks[focusedIdx];
          cycleTaskPriority(target.id);
          return;
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    showHelp,
    setShowHelp,
    menuOpen,
    showOnboarding,
    visibleTasks,
    focusedIdx,
    setFocusedIdx,
    activeTab,
    switchTab,
    toggleTask,
    deleteTask,
    resolveTask,
    cycleTaskPriority,
    setActionMenuTaskId,
    setPriorityPopoverTaskId,
    inputRef,
    setInput,
  ]);
};
