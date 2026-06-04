import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function WinnerDisplay({ winner, show, onDismiss, drawNumber }) {
  const confettiFired = useRef(false);
  const dismissBtnRef = useRef(null);
  const labelId = 'winner-label';
  const nameId = 'winner-name';

  useEffect(() => {
    if (!show || !winner) {
      confettiFired.current = false;
      return undefined;
    }
    if (confettiFired.current) return undefined;
    confettiFired.current = true;

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

    // Move focus into the dialog for keyboard / screen-reader users
    const focusTimer = window.setTimeout(() => {
      dismissBtnRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(burstTimer);
      window.clearTimeout(focusTimer);
    };
  }, [show, winner]);

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
            <h2 id={labelId} className="winner-label">
              Winner #{drawNumber}!
            </h2>
            <h1 id={nameId} className="winner-name" aria-live="polite">
              {winner}
            </h1>
            <div className="winner-stars" aria-hidden="true">
              ⭐ Congratulations! ⭐
            </div>
            <button
              ref={dismissBtnRef}
              className="winner-dismiss"
              onClick={onDismiss}
              aria-keyshortcuts="Escape"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
