"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useEscape } from "./overlay";

interface PopoverProps {
  trigger: (state: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
  /** Open above the trigger instead of below. */
  up?: boolean;
  /** Classes for the floating panel (width, padding). */
  panelClassName?: string;
  /** Classes for the wrapper that anchors the panel. */
  className?: string;
}

/** Dropdown panel anchored to a trigger. Closes on outside click or Escape. */
export function Popover({ trigger, children, align = "left", up, panelClassName, className }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  useEscape(open, close);
  return (
    <div className={cn("relative", className)}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={close} />
          <div
            className={cn(
              "absolute z-[31] animate-rise rounded-xl border border-border bg-surface shadow-pop",
              up ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]",
              align === "right" ? "right-0" : "left-0",
              panelClassName,
            )}
          >
            {children(close)}
          </div>
        </>
      )}
    </div>
  );
}
