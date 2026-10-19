import type { DragPayload } from "./shift-block";

/**
 * What is being dragged right now. HTML5 drag-and-drop only exposes the payload as a string while
 * hovering, so the typed payload lives here between `dragstart` and `drop`.
 */
let current: DragPayload | null = null;

export const dragState = {
  get: (): DragPayload | null => current,
  set: (payload: DragPayload | null): void => {
    current = payload;
  },
  /** Returns and clears the payload. */
  take: (): DragPayload | null => {
    const p = current;
    current = null;
    return p;
  },
};
