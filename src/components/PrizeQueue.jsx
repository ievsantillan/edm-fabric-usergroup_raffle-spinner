import { useState } from 'react';

// Collapsible panel that lists the prize queue and lets the organiser
// re-order any UNAWARDED prizes via up/down buttons. Already-awarded
// prizes are shown as locked at the top so the user can see what was
// given out without being able to mess with the historical order.
//
// We use buttons rather than HTML5 drag-and-drop because:
//   1. Buttons are fully keyboard- and screen-reader accessible with zero
//      extra ARIA gymnastics.
//   2. On a presenter podium with a single trackpad or remote, click-to-move
//      is faster and less error-prone than a drag gesture.
//   3. No extra dependency (dnd-kit / react-beautiful-dnd) for ~30 lines of
//      array logic.
//
// Props:
//   prizes        — full prize array (awarded + remaining), in current order
//   awardedCount  — how many prizes have already been given out (= winners.length)
//   onReorder     — (fromIdx, toIdx) => void; indices are relative to the
//                   UNAWARDED slice, so 0 = next prize to draw.
export default function PrizeQueue({ prizes, awardedCount, onReorder }) {
  // Collapsed by default to keep the spinner above the fold. Persisting this
  // would be overkill — it's a single click and irrelevant after the event.
  const [open, setOpen] = useState(false);

  const awarded = prizes.slice(0, awardedCount);
  const remaining = prizes.slice(awardedCount);

  if (prizes.length === 0) return null;

  return (
    <details
      className="prize-queue"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="prize-queue-summary">
        <span className="prize-queue-summary-title">
          <span aria-hidden="true">🗂️</span> Prize queue
        </span>
        <span className="prize-queue-summary-hint">
          {remaining.length} remaining · click to {open ? 'collapse' : 'reorder'}
        </span>
      </summary>

      <ol className="prize-queue-list" aria-label="Prize queue">
        {awarded.map((p, i) => (
          <li
            key={`awarded-${i}`}
            className="prize-queue-item prize-queue-item--awarded"
            title="Already awarded"
          >
            <span className="prize-queue-position" aria-hidden="true">
              {i + 1}
            </span>
            <span className="prize-queue-name">{p}</span>
            <span className="prize-queue-badge" aria-label="Already awarded">
              awarded
            </span>
          </li>
        ))}

        {remaining.map((p, i) => {
          const isFirst = i === 0;
          const isLast = i === remaining.length - 1;
          const absolutePosition = awardedCount + i + 1;
          return (
            <li
              key={`remaining-${i}-${p}`}
              className="prize-queue-item prize-queue-item--remaining"
            >
              <span className="prize-queue-position" aria-hidden="true">
                {absolutePosition}
              </span>
              <span className="prize-queue-name">
                {isFirst && (
                  <span className="prize-queue-next-tag" aria-label="Up next">
                    NEXT
                  </span>
                )}
                {p}
              </span>
              <span className="prize-queue-controls">
                <button
                  type="button"
                  className="prize-queue-arrow"
                  onClick={() => onReorder(i, i - 1)}
                  disabled={isFirst}
                  aria-label={`Move "${p}" up`}
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="prize-queue-arrow"
                  onClick={() => onReorder(i, i + 1)}
                  disabled={isLast}
                  aria-label={`Move "${p}" down`}
                  title="Move down"
                >
                  ▼
                </button>
              </span>
            </li>
          );
        })}
      </ol>
    </details>
  );
}
