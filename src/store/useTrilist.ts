import { useState, useEffect, useCallback } from 'react';

export type TrilistItem = {
  id: string;
  title: string;
  note?: string;
  createdAt: number;
  next_move: 'me' | 'external';
  committed: boolean;
  watchSince?: number;
  lastTouched: number;
};

export type AntiTodo = {
  id: string;
  content: string;
  timestamp: number;
};

type TrilistState = {
  items: TrilistItem[];
  antiTodos: AntiTodo[];
  todaySelection: string[];
  lastArchivedDate: string | null;
};

const STORAGE_KEY = 'trilist_data';

export const useTrilist = () => {
  const [state, setState] = useState<TrilistState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          items: parsed.items || [],
          antiTodos: parsed.antiTodos || [],
          todaySelection: parsed.todaySelection || [],
          lastArchivedDate: parsed.lastArchivedDate || null,
        };
      } catch (e) {
        console.error("Failed to parse trilist data", e);
      }
    }
    return {
      items: [],
      antiTodos: [],
      todaySelection: [],
      lastArchivedDate: null,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addItem = useCallback((
    title: string,
    next_move: 'me' | 'external',
    committed: boolean,
    note?: string
  ) => {
    const now = Date.now();
    const newItem: TrilistItem = {
      id: crypto.randomUUID(),
      title,
      note,
      createdAt: now,
      next_move,
      committed,
      lastTouched: now,
      ...(next_move === 'external' ? { watchSince: now } : {}),
    };
    setState((prev) => {
      const newItems = [...prev.items, newItem];
      const newSelection = (next_move === 'me' && committed) ? [...prev.todaySelection, newItem.id] : prev.todaySelection;
      return { ...prev, items: newItems, todaySelection: newSelection };
    });
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<Omit<TrilistItem, 'id' | 'createdAt'>>) => {
    setState((prev) => {
      const now = Date.now();
      return {
        ...prev,
        items: prev.items.map(item => {
          if (item.id === id) {
            const next_move = updates.next_move !== undefined ? updates.next_move : item.next_move;
            const becameExternal = next_move === 'external' && item.next_move === 'me';
            
            return {
              ...item,
              ...updates,
              lastTouched: now,
              ...(becameExternal ? { watchSince: now } : {}),
            };
          }
          return item;
        })
      };
    });
  }, []);

  const deleteItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
      todaySelection: prev.todaySelection.filter(itemId => itemId !== id),
    }));
  }, []);

  const toggleTodaySelection = useCallback((id: string) => {
    setState((prev) => {
      const isSelected = prev.todaySelection.includes(id);
      if (isSelected) {
        return { ...prev, todaySelection: prev.todaySelection.filter(itemId => itemId !== id) };
      } else {
        return { ...prev, todaySelection: [...prev.todaySelection, id] };
      }
    });
  }, []);

  const addAntiTodo = useCallback((content: string) => {
    const newAntiTodo: AntiTodo = {
      id: crypto.randomUUID(),
      content,
      timestamp: Date.now(),
    };
    setState((prev) => ({ ...prev, antiTodos: [...prev.antiTodos, newAntiTodo] }));
  }, []);

  const archiveDay = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    setState((prev) => {
      // Remove items in todaySelection from the collection
      const remainingItems = prev.items.filter(item => !prev.todaySelection.includes(item.id));
      return {
        ...prev,
        items: remainingItems,
        antiTodos: [],
        todaySelection: [],
        lastArchivedDate: todayStr,
      };
    });
  }, []);

  return {
    items: state.items,
    antiTodos: state.antiTodos,
    todaySelection: state.todaySelection,
    lastArchivedDate: state.lastArchivedDate,
    addItem,
    updateItem,
    deleteItem,
    toggleTodaySelection,
    addAntiTodo,
    archiveDay,
  };
};
