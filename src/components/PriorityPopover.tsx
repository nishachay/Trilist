import React from "react";
import { motion } from "motion/react";
import { Flag } from "lucide-react";
import type { PriorityLevel } from "@/types";

interface PriorityPopoverProps {
  isNearBottom: boolean;
  setTaskPriority: (p?: PriorityLevel) => void;
  closePopover: () => void;
}

export const PriorityPopover: React.FC<PriorityPopoverProps> = ({
  isNearBottom,
  setTaskPriority,
  closePopover,
}) => {
  return (
    <motion.div
      className="priority-popover"
      data-position={isNearBottom ? "top" : "bottom"}
      initial={{ opacity: 0, scale: 0.94, y: isNearBottom ? -6 : 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: isNearBottom ? -6 : 6 }}
      transition={{ duration: 0.12 }}
    >
      <button
        className="priority-popover-item"
        data-priority={1}
        onClick={(e) => {
          e.stopPropagation();
          setTaskPriority(1);
          closePopover();
        }}
      >
        <Flag size={13} fill="var(--p1-color)" color="var(--p1-color)" />
        <span>P1 — High</span>
      </button>
      <button
        className="priority-popover-item"
        data-priority={2}
        onClick={(e) => {
          e.stopPropagation();
          setTaskPriority(2);
          closePopover();
        }}
      >
        <Flag size={13} fill="var(--p2-color)" color="var(--p2-color)" />
        <span>P2 — Medium</span>
      </button>
      <button
        className="priority-popover-item"
        data-priority={3}
        onClick={(e) => {
          e.stopPropagation();
          setTaskPriority(3);
          closePopover();
        }}
      >
        <Flag size={13} fill="var(--p3-color)" color="var(--p3-color)" />
        <span>P3 — Low</span>
      </button>
      <button
        className="priority-popover-item"
        onClick={(e) => {
          e.stopPropagation();
          setTaskPriority(undefined);
          closePopover();
        }}
      >
        <Flag size={13} color="var(--text-faint)" />
        <span>Clear</span>
      </button>
    </motion.div>
  );
};
