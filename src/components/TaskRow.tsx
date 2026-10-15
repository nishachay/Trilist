import React, { useRef } from "react";
import { AnimatePresence } from "motion/react";
import { Check, Ellipsis } from "lucide-react";
import type { Task, ListKey, PriorityLevel } from "@/types";
import { TaskMenu, PriorityMenu } from "./TaskMenu";
import { GLYPH, ICON_LG } from "@/lib/icons";

interface TaskRowProps {
  task: Task;
  index: number;
  activeTab: ListKey;
  focused: boolean;
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
  togglePin: (taskId: string) => void;
  watchAge?: string;
  menuOpen: boolean;
  toggleActionMenu: (taskId: string) => void;
  closeActionMenu: () => void;
  priorityOpen: boolean;
  togglePriorityPopover: (taskId: string) => void;
  closePriorityPopover: () => void;
}

const PRIORITY_NAME: Record<PriorityLevel, string> = { 1: "high", 2: "medium", 3: "low" };

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  index,
  activeTab,
  focused,
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
  togglePin,
  watchAge,
  menuOpen,
  toggleActionMenu,
  closeActionMenu,
  priorityOpen,
  togglePriorityPopover,
  closePriorityPopover,
}) => {
  const menuBtn = useRef<HTMLButtonElement>(null);
  const prioBtn = useRef<HTMLButtonElement>(null);
  const textId = `task-${task.id}`;

  const lead = (() => {
    if (activeTab === "rough") {
      return <span className="lead-dot" aria-hidden="true" />;
    }
    if (activeTab === "watch") {
      return (
        <button
          type="button"
          className="check check-round"
          aria-label="Resolve"
          aria-describedby={textId}
          disabled={task.resolving}
          onClick={e => { e.stopPropagation(); resolveTask(task.id); }}
        >
          <Check {...GLYPH} />
        </button>
      );
    }
    return (
      <button
        type="button"
        className="check"
        role="checkbox"
        aria-checked={task.done}
        aria-describedby={textId}
        aria-label={task.done ? "Mark not done" : "Mark done"}
        data-priority={task.priority}
        onClick={e => { e.stopPropagation(); toggleTask(task.id); }}
      >
        <Check {...GLYPH} />
      </button>
    );
  })();

  return (
    <li
      className="row"
      data-focused={focused || undefined}
      data-done={task.done || undefined}
      data-resolving={task.resolving || undefined}
      data-open={menuOpen || priorityOpen || undefined}
      onClick={() => {
        // Row selection drives the keyboard; on touch it would only leave a stuck highlight.
        if (window.matchMedia("(hover: hover)").matches) setFocusedIdx(index);
      }}
    >
      <span className="row-lead">{lead}</span>

      {isEditing ? (
        <input
          autoFocus
          aria-label="Edit item"
          className="row-edit"
          value={editInput}
          spellCheck
          onChange={e => setEditInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") saveEdit();
            if (e.key === "Escape") { e.stopPropagation(); cancelEdit(); }
          }}
          onBlur={saveEdit}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span id={textId} className="row-text" onDoubleClick={() => startEditing(task)}>
          {task.text}
        </span>
      )}

      {!isEditing && (
        <span className="row-meta">
          {task.priority && (
            <span className="anchor">
              <button
                ref={prioBtn}
                type="button"
                className="prio"
                data-priority={task.priority}
                aria-haspopup="dialog"
                aria-expanded={priorityOpen}
                aria-label={`Priority ${task.priority}, ${PRIORITY_NAME[task.priority]}. Change priority`}
                onClick={e => { e.stopPropagation(); togglePriorityPopover(task.id); }}
              >
                P{task.priority}
              </button>
              <AnimatePresence>
                {priorityOpen && (
                  <PriorityMenu
                    anchorRef={prioBtn}
                    current={task.priority}
                    onPick={p => { setTaskPriority(task.id, p); closePriorityPopover(); }}
                    onClose={closePriorityPopover}
                  />
                )}
              </AnimatePresence>
            </span>
          )}

          {watchAge && (
            <span className="age" title={`Added ${new Date(task.createdAt).toLocaleDateString()}`}>
              {watchAge}
            </span>
          )}

          <span className="anchor">
            <button
              ref={menuBtn}
              type="button"
              className="row-more"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-label="Item actions"
              onClick={e => { e.stopPropagation(); toggleActionMenu(task.id); }}
            >
              <Ellipsis {...ICON_LG} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <TaskMenu
                  anchorRef={menuBtn}
                  task={task}
                  onClose={closeActionMenu}
                  setTaskPriority={setTaskPriority}
                  moveTask={moveTask}
                  togglePin={togglePin}
                  startEditing={startEditing}
                  deleteTask={deleteTask}
                />
              )}
            </AnimatePresence>
          </span>
        </span>
      )}
    </li>
  );
};
