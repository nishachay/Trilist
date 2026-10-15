import React from "react";
import { Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import type { Task, ListKey, PriorityLevel } from "@/types";
import { LIST_LABEL } from "@/lib/commands";
import { Popover } from "./ui/Popover";
import { ICON } from "@/lib/icons";


const PRIORITIES: { value?: PriorityLevel; label: string }[] = [
  { value: 1, label: "P1" },
  { value: 2, label: "P2" },
  { value: 3, label: "P3" },
  { value: undefined, label: "None" },
];

const MOVE_TARGETS: ListKey[] = ["todo", "watch", "later", "rough"];

interface TaskMenuProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  task: Task;
  onClose: () => void;
  setTaskPriority: (taskId: string, p?: PriorityLevel) => void;
  moveTask: (taskId: string, list: ListKey) => void;
  togglePin: (taskId: string) => void;
  startEditing: (task: Task) => void;
  deleteTask: (taskId: string) => void;
}

export const TaskMenu: React.FC<TaskMenuProps> = ({
  anchorRef,
  task,
  onClose,
  setTaskPriority,
  moveTask,
  togglePin,
  startEditing,
  deleteTask,
}) => (
  <Popover anchorRef={anchorRef} onClose={onClose} label="Item actions">
    <p className="menu-title" aria-hidden="true">{task.text}</p>

    <div className="menu-group" role="group" aria-labelledby={`prio-${task.id}`}>
      <span className="menu-label" id={`prio-${task.id}`}>Priority</span>
      <div className="segmented">
        {PRIORITIES.map(p => (
          <button
            key={p.label}
            type="button"
            className="segment"
            data-priority={p.value}
            aria-pressed={task.priority === p.value}
            onClick={() => { setTaskPriority(task.id, p.value); onClose(); }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>

    <div className="menu-group" role="group" aria-labelledby={`move-${task.id}`}>
      <span className="menu-label" id={`move-${task.id}`}>Move to</span>
      <div className="segmented">
        {MOVE_TARGETS.map(l => (
          <button
            key={l}
            type="button"
            className="segment"
            aria-pressed={task.list === l}
            onClick={() => { moveTask(task.id, l); onClose(); }}
          >
            {LIST_LABEL[l]}
          </button>
        ))}
      </div>
    </div>

    <div className="menu-items">
      {task.list === "todo" && !task.done && (
        <button type="button" className="menu-item" onClick={() => { togglePin(task.id); onClose(); }}>
          {task.pinned ? <PinOff {...ICON} /> : <Pin {...ICON} />}
          <span>{task.pinned ? "Unpin from Focus" : "Pin to Focus"}</span>
          <span className="menu-kbd" aria-hidden="true">P</span>
        </button>
      )}
      <button type="button" className="menu-item" onClick={() => { onClose(); startEditing(task); }}>
        <Pencil {...ICON} />
        <span>Edit…</span>
      </button>
      <button type="button" className="menu-item" onClick={() => { onClose(); deleteTask(task.id); }}>
        <Trash2 {...ICON} />
        <span>Delete</span>
        <span className="menu-kbd" aria-hidden="true">X</span>
      </button>
    </div>
  </Popover>
);

interface PriorityMenuProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  current?: PriorityLevel;
  onPick: (p?: PriorityLevel) => void;
  onClose: () => void;
}

const PRIORITY_ITEMS: { value?: PriorityLevel; label: string; hint: string }[] = [
  { value: 1, label: "High", hint: "P1" },
  { value: 2, label: "Medium", hint: "P2" },
  { value: 3, label: "Low", hint: "P3" },
  { value: undefined, label: "No priority", hint: "" },
];

export const PriorityMenu: React.FC<PriorityMenuProps> = ({ anchorRef, current, onPick, onClose }) => (
  <Popover anchorRef={anchorRef} onClose={onClose} label="Priority" className="menu-narrow">
    <div className="menu-items">
      {PRIORITY_ITEMS.map(p => (
        <button
          key={p.label}
          type="button"
          className="menu-item"
          aria-pressed={current === p.value}
          onClick={() => onPick(p.value)}
        >
          <span className="prio-swatch" data-priority={p.value ?? "none"} aria-hidden="true" />
          <span>{p.label}</span>
          {p.hint && <span className="menu-kbd" aria-hidden="true">{p.hint}</span>}
        </button>
      ))}
    </div>
  </Popover>
);
