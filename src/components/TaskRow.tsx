import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { MoreHorizontal, Flag } from "lucide-react";
import type { Task, ListKey, PriorityLevel } from "@/types";
import { ContextPopover } from "./ContextPopover";
import { PriorityPopover } from "./PriorityPopover";

interface TaskRowProps {
  task: Task;
  index: number;
  activeTab: ListKey;
  focusedIdx: number | null;
  setFocusedIdx: (idx: number) => void;
  isEditing: boolean;
  editInput: string;
  setEditInput: (val: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  startEditing: (task: Task) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  resolveTask: (id: string) => void;
  setTaskPriority: (taskId: string, p?: PriorityLevel) => void;
  moveTask: (taskId: string, list: ListKey) => void;
  actionMenuTaskId: string | null;
  toggleActionMenu: (taskId: string) => void;
  setActionMenuTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  priorityPopoverTaskId: string | null;
  togglePriorityPopover: (taskId: string) => void;
  setPriorityPopoverTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  isNearBottom: boolean;
}

const Checkbox: React.FC<{ done: boolean; onToggle: () => void }> = ({ done, onToggle }) => (
  <button
    className="checkbox"
    data-done={done}
    onClick={(e) => { e.stopPropagation(); onToggle(); }}
    title={done ? "Mark incomplete" : "Mark complete"}
  >
    {done && (
      <svg viewBox="0 0 12 10" width="10" height="8" fill="none">
        <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </button>
);

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  index,
  activeTab,
  focusedIdx,
  setFocusedIdx,
  isEditing,
  editInput,
  setEditInput,
  saveEdit,
  cancelEdit,
  startEditing,
  toggleTask,
  deleteTask,
  resolveTask,
  setTaskPriority,
  moveTask,
  actionMenuTaskId,
  toggleActionMenu,
  setActionMenuTaskId,
  priorityPopoverTaskId,
  togglePriorityPopover,
  setPriorityPopoverTaskId,
  isNearBottom,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, transition: { duration: 0.16 } }}
      transition={{ duration: 0.18, delay: index * 0.035, ease: "easeOut" }}
      className={`row${task.resolving ? " resolving" : ""}`}
      data-focused={focusedIdx === index}
      onClick={() => setFocusedIdx(index)}
    >
      {activeTab === "rough" && <div className="rough-dot" />}
      {activeTab === "todo"  && <Checkbox done={task.done} onToggle={() => toggleTask(task.id)} />}
      {activeTab === "watch" && <div className="watch-dot" />}
      {activeTab === "later" && <Checkbox done={task.done} onToggle={() => toggleTask(task.id)} />}

      {isEditing ? (
        <input
          autoFocus
          className="row-edit-input"
          value={editInput}
          onChange={(e) => setEditInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveEdit();
            if (e.key === "Escape") cancelEdit();
          }}
          onBlur={saveEdit}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="row-text"
          data-done={task.done}
          onDoubleClick={() => startEditing(task)}
          title="Double-click to edit"
        >
          {task.text}
        </span>
      )}

      {/* Extreme Right Action Controls */}
      {!isEditing && (
        <div className="row-meta">
          <div
            className="row-context-wrap"
            onMouseLeave={() => setActionMenuTaskId(null)}
          >
            {activeTab === "watch" && !task.resolving && (
              <button className="resolve-btn" onClick={() => resolveTask(task.id)}>
                Resolved
              </button>
            )}

            <button
              className="row-action-btn context-trigger"
              onClick={(e) => {
                e.stopPropagation();
                toggleActionMenu(task.id);
              }}
              title="Actions & Priority"
              aria-label="Actions"
            >
              <MoreHorizontal size={14} />
            </button>

            <AnimatePresence>
              {actionMenuTaskId === task.id && (
                <ContextPopover
                  task={task}
                  isNearBottom={isNearBottom}
                  setTaskPriority={setTaskPriority}
                  moveTask={moveTask}
                  startEditing={startEditing}
                  deleteTask={deleteTask}
                  closePopover={() => setActionMenuTaskId(null)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Active Priority Badge at EXTREME RIGHT EDGE */}
          {task.priority && (
            <div
              className="priority-pill-wrap"
              onMouseLeave={() => setPriorityPopoverTaskId(null)}
            >
              <button
                className="priority-pill-btn"
                data-priority={task.priority}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePriorityPopover(task.id);
                }}
                title={`Priority P${task.priority} (Click to change)`}
              >
                <Flag
                  size={12}
                  fill={task.priority === 1 ? "var(--p1-color)" : task.priority === 2 ? "var(--p2-color)" : "var(--p3-color)"}
                  color={task.priority === 1 ? "var(--p1-color)" : task.priority === 2 ? "var(--p2-color)" : "var(--p3-color)"}
                />
                <span className="priority-code">P{task.priority}</span>
              </button>

              <AnimatePresence>
                {priorityPopoverTaskId === task.id && (
                  <PriorityPopover
                    isNearBottom={isNearBottom}
                    setTaskPriority={(p) => setTaskPriority(task.id, p)}
                    closePopover={() => setPriorityPopoverTaskId(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
