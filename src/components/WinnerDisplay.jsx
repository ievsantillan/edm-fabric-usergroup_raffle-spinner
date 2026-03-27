import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function WinnerDisplay({ winner, show, onDismiss, drawNumber }) {
  const confettiFired = useRef(false);

  useEffect(() => {
    if (show && winner && !confettiFired.current) {
      confettiFired.current = true;

      // Fire confetti from both sides
      const defaults = {
        spread: 60,
        ticks: 100,
        gravity: 0.8,
        decay: 0.94,
        startVelocity: 30,
        colors: ['#742774', '#0078D4', '#FFB900', '#107C10', '#D83B01'],
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

      // Second burst after 300ms
      setTimeout(() => {
        fire(0.3, { spread: 100, startVelocity: 45, origin: { x: 0.5, y: 0.5 } });
      }, 300);
    }

    if (!show) {
      confettiFired.current = false;
    }
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
        >
          <motion.div
            className="winner-card"
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          >
            <div className="winner-trophy">🏆</div>
            <h2 className="winner-label">Winner #{drawNumber}!</h2>
            <h1 className="winner-name">{winner}</h1>
            <div className="winner-stars">⭐ Congratulations! ⭐</div>
            <button className="winner-dismiss" onClick={onDismiss}>
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
