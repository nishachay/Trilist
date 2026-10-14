import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";

interface PopoverProps {
  /** Element the popover hangs from; focus returns here on close. */
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  label: string;
  className?: string;
  children: React.ReactNode;
}

const SHEET_QUERY = "(max-width: 560px)";
/** Room the omnibar takes at the bottom of the viewport. */
const BOTTOM_RESERVE = 96;

/**
 * Floating menu anchored to a trigger. Opens below when it fits, above when
 * it doesn't, and becomes a bottom sheet on narrow screens. Closes on outside
 * press or Escape and hands focus back to the trigger.
 */
export const Popover: React.FC<PopoverProps> = ({ anchorRef, onClose, label, className, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<"below" | "above">("below");
  const [sheet] = useState(() => typeof window !== "undefined" && window.matchMedia(SHEET_QUERY).matches);

  useLayoutEffect(() => {
    if (sheet) return;
    const anchor = anchorRef.current;
    const el = ref.current;
    if (!anchor || !el) return;
    const a = anchor.getBoundingClientRect();
    const h = el.offsetHeight;
    const spaceBelow = window.innerHeight - a.bottom - BOTTOM_RESERVE;
    const spaceAbove = a.top - 64;
    setPlacement(spaceBelow < h + 8 && spaceAbove > spaceBelow ? "above" : "below");
  }, [anchorRef, sheet]);

  useEffect(() => {
    const anchor = anchorRef.current;
    const first = ref.current?.querySelector<HTMLElement>("[data-autofocus], button:not(:disabled)");
    first?.focus({ preventScroll: true });

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchor?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        anchor?.focus({ preventScroll: true });
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const items = Array.from(ref.current?.querySelectorAll<HTMLElement>("button:not(:disabled)") ?? []);
        if (items.length === 0) return;
        e.preventDefault();
        e.stopPropagation();
        const i = items.indexOf(document.activeElement as HTMLElement);
        const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
        items[next].focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [anchorRef, onClose]);

  const panel = (
    <motion.div
      ref={ref}
      role="dialog"
      aria-label={label}
      className={["popover", sheet ? "popover-sheet" : `popover-${placement}`, className].filter(Boolean).join(" ")}
      initial={sheet ? { opacity: 0, y: 24 } : { opacity: 0, scale: 0.96 }}
      animate={sheet ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1 }}
      exit={sheet ? { opacity: 0, y: 24 } : { opacity: 0, scale: 0.96, transition: { duration: 0.1 } }}
      transition={{ duration: sheet ? 0.2 : 0.14, ease: [0.2, 0, 0, 1] }}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </motion.div>
  );

  if (!sheet) return panel;
  return (
    <>
      <motion.div
        className="scrim"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={e => e.stopPropagation()}
      />
      {panel}
    </>
  );
};
