import React from "react";
import { AnimatePresence, motion } from "motion/react";

export interface ToastData {
  id: number;
  message: string;
  undoLabel?: string;
  onUndo?: () => void;
}

/**
 * One calm toast, bottom-centre above the omnibar. The live region is always
 * mounted so screen readers announce each new message.
 */
interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
  /** Hovering or focusing the toast holds it open. */
  onHold: (hold: boolean) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss, onHold }) => (
  <div className="toast-region" role="status" aria-live="polite">
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          className="toast"
          onPointerEnter={() => onHold(true)}
          onPointerLeave={() => onHold(false)}
          onFocus={() => onHold(true)}
          onBlur={() => onHold(false)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4, transition: { duration: 0.12 } }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
        >
          <span className="toast-msg">{toast.message}</span>
          {toast.onUndo && (
            <button
              type="button"
              className="toast-action"
              onClick={() => { toast.onUndo?.(); onDismiss(); }}
            >
              {toast.undoLabel ?? "Undo"}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
