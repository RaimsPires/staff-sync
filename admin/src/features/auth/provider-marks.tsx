/** Four-square Microsoft mark in the brand colours. `cell` is the square size in px. */
export function MicrosoftMark({ cell = 7 }: { cell?: number }) {
  const square = { width: cell, height: cell };
  return (
    <span className="grid gap-[1.5px]" style={{ gridTemplateColumns: `${cell}px ${cell}px` }} aria-hidden>
      <span style={{ ...square, background: "#F25022" }} />
      <span style={{ ...square, background: "#7FBA00" }} />
      <span style={{ ...square, background: "#00A4EF" }} />
      <span style={{ ...square, background: "#FFB900" }} />
    </span>
  );
}
