import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Flag, X, Pencil, Trash2 } from "lucide-react";
import type { Task, ListKey, PriorityLevel } from "@/types";

interface ContextPopoverProps {
  task: Task;
  isNearBottom: boolean;
  setTaskPriority: (taskId: string, p?: PriorityLevel) => void;
  moveTask: (taskId: string, list: ListKey) => void;
  startEditing: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  closePopover: () => void;
}

export const ContextPopover: React.FC<ContextPopoverProps> = ({
  task,
  isNearBottom,
  setTaskPriority,
  moveTask,
  startEditing,
  deleteTask,
  closePopover,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        closePopover();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [closePopover]);

  return (
    <motion.div
      ref={ref}
      className="context-popover"
      data-position={isNearBottom ? "top" : "bottom"}
      initial={{ opacity: 0, scale: 0.94, y: isNearBottom ? -6 : 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: isNearBottom ? -6 : 6 }}
      transition={{ duration: 0.12 }}
    >
      <div className="context-popover-section">PRIORITY</div>
      <div className="priority-segments">
        <button
          className="p-segment"
          data-priority="1"
          data-active={task.priority === 1}
          onClick={(e) => {
            e.stopPropagation();
            setTaskPriority(task.id, 1);
            closePopover();
          }}
          title="P1 High Priority"
        >
          <Flag size={11} fill="var(--p1-color)" color="var(--p1-color)" />
          <span>P1</span>
        </button>
        <button
          className="p-segment"
          data-priority="2"
          data-active={task.priority === 2}
          onClick={(e) => {
            e.stopPropagation();
            setTaskPriority(task.id, 2);
            closePopover();
          }}
          title="P2 Medium Priority"
        >
          <Flag size={11} fill="var(--p2-color)" color="var(--p2-color)" />
          <span>P2</span>
        </button>
        <button
          className="p-segment"
          data-priority="3"
          data-active={task.priority === 3}
          onClick={(e) => {
            e.stopPropagation();
            setTaskPriority(task.id, 3);
            closePopover();
          }}
          title="P3 Low Priority"
        >
          <Flag size={11} fill="var(--p3-color)" color="var(--p3-color)" />
          <span>P3</span>
        </button>
        <button
          className="p-segment"
          data-active={!task.priority}
          onClick={(e) => {
            e.stopPropagation();
            setTaskPriority(task.id, undefined);
            closePopover();
          }}
          title="Clear Priority"
        >
          <X size={11} color="var(--text-faint)" />
        </button>
      </div>

      <div className="context-popover-section">MOVE TO</div>
      <div className="move-segments">
        {[
          { id: "todo",  label: "Todo"  },
          { id: "watch", label: "Watch" },
          { id: "later", label: "Later" },
          { id: "rough", label: "Rough" },
        ].map(l => (
          <button
            key={l.id}
            className="m-segment"
            data-active={task.list === l.id}
            onClick={(e) => {
              e.stopPropagation();
              moveTask(task.id, l.id as ListKey);
              closePopover();
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="context-popover-section">ACTIONS</div>
      <div className="context-action-row">
        <button
          className="context-popover-item"
          onClick={(e) => {
            e.stopPropagation();
            closePopover();
            startEditing(task);
          }}
        >
          <Pencil size={13} />
          <span>Edit</span>
        </button>
        <button
          className="context-popover-item del"
          onClick={(e) => {
            e.stopPropagation();
            closePopover();
            deleteTask(task.id);
          }}
        >
          <Trash2 size={13} />
          <span>Delete</span>
        </button>
      </div>
    </motion.div>
  );
};
