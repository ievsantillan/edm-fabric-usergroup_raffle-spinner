import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function WinnerDisplay({
  winner,
  prize,
  prizes,
  show,
  onDismiss,
  onChangePrize,
  onReroll,
  canReroll,
  drawNumber,
}) {
  const confettiFired = useRef(false);
  const dismissBtnRef = useRef(null);
  // Confetti is pure decorative motion and can trigger motion sickness, so we
  // skip it entirely when the OS-level "Reduce Motion" setting is enabled.
  // The MotionConfig wrapper in main.jsx handles the rest (transforms become
  // simple opacity fades for framer-motion children automatically).
  const shouldReduceMotion = useReducedMotion();
  const labelId = 'winner-label';
  const nameId = 'winner-name';
  const prizeSelectId = 'winner-prize-select';
  const hasPrizeChoices =
    Array.isArray(prizes) && prizes.length > 0 && typeof onChangePrize === 'function';
  const canShowReroll = typeof onReroll === 'function';

  useEffect(() => {
    if (!show || !winner) {
      confettiFired.current = false;
      return undefined;
    }
    if (confettiFired.current) return undefined;
    confettiFired.current = true;

    // Move focus into the dialog for keyboard / screen-reader users. We do
    // this regardless of motion preference — it's a focus management concern,
    // not an animation one.
    const focusTimer = window.setTimeout(() => {
      dismissBtnRef.current?.focus();
    }, 0);

    if (shouldReduceMotion) {
      return () => window.clearTimeout(focusTimer);
    }

    // Fire confetti from both sides
    const defaults = {
      spread: 60,
      ticks: 100,
      gravity: 0.8,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#2CF267', '#1b896c', '#147966', '#FFB900', '#ffffff'],
    };

    const fire = (particleRatio, opts) => {
      confetti({
        ...defaults,
        particleCount: Math.floor(200 * particleRatio),
        ...opts,
      });
    };

    fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.1, y: 0.7 } });
    fire(0.2, { spread: 60, origin: { x: 0.3, y: 0.6 } });
    fire(0.35, { spread: 80, startVelocity: 40, origin: { x: 0.5, y: 0.65 } });
    fire(0.2, { spread: 60, origin: { x: 0.7, y: 0.6 } });
    fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.9, y: 0.7 } });

    // Second burst after 300ms — capture id so we can cancel on unmount/dismiss
    const burstTimer = window.setTimeout(() => {
      fire(0.3, { spread: 100, startVelocity: 45, origin: { x: 0.5, y: 0.5 } });
    }, 300);

    return () => {
      window.clearTimeout(burstTimer);
      window.clearTimeout(focusTimer);
    };
  }, [show, winner, shouldReduceMotion]);

  return (
    <AnimatePresence>
      {show && winner && (
        <motion.div
          className="winner-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelId}
          aria-describedby={nameId}
        >
          <motion.div
            className="winner-card"
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          >
            <div className="winner-trophy" aria-hidden="true">🏆</div>
            {prize ? (
              <p className="winner-prize" aria-label={`Prize: ${prize}`}>
                <span aria-hidden="true">🎁</span> {prize}
              </p>
            ) : null}
            <h2 id={labelId} className="winner-label">
              {prize ? 'Goes to' : `Winner #${drawNumber}!`}
            </h2>
            <h1 id={nameId} className="winner-name" aria-live="polite">
              {winner}
            </h1>
            <div className="winner-stars" aria-hidden="true">
              ⭐ Congratulations! ⭐
            </div>

            {hasPrizeChoices && (
              <div className="winner-prize-override">
                <label htmlFor={prizeSelectId} className="winner-prize-override-label">
                  Change prize:
                </label>
                <select
                  id={prizeSelectId}
                  className="winner-prize-override-select"
                  value={prize ?? ''}
                  onChange={(e) => onChangePrize(e.target.value || null)}
                >
                  {/* If the current prize isn't in the list (e.g. legacy data),
                      surface it so the select stays in sync rather than silently
                      flipping to the first option. */}
                  {prize && !prizes.includes(prize) && (
                    <option value={prize}>{prize}</option>
                  )}
                  {prizes.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="winner-actions">
              <button
                ref={dismissBtnRef}
                className="winner-dismiss"
                onClick={onDismiss}
                aria-keyshortcuts="Escape"
              >
                Continue
              </button>
              {canShowReroll && (
                <button
                  className="winner-reroll"
                  onClick={onReroll}
                  disabled={!canReroll}
                  title={
                    canReroll
                      ? 'Remove this person from the pool and draw a new winner'
                      : 'No other participants remain — cannot re-roll'
                  }
                  aria-keyshortcuts="N"
                >
                  Not here — re-roll
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
