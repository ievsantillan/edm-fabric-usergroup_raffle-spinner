import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ITEM_HEIGHT = 80;
const VISIBLE_ITEMS = 5;
const SPIN_DURATION = 4000; // ms

export default function SlotMachine({
  participants,
  isSpinning,
  onSpinStart,
  onSpinEnd,
  playTick,
  disabled,
}) {
  const [displayNames, setDisplayNames] = useState([]);
  const [offset, setOffset] = useState(0);
  const [winner, setWinner] = useState(null);
  const [glowing, setGlowing] = useState(false);
  const animRef = useRef(null);
  const tickTimerRef = useRef(null);

  // Build a long repeating reel of shuffled names
  const buildReel = useCallback(
    (winnerName) => {
      const shuffled = [...participants].sort(() => Math.random() - 0.5);
      // Build a long reel: repeat shuffled names many times
      const reps = Math.max(10, Math.ceil(80 / participants.length));
      let reel = [];
      for (let i = 0; i < reps; i++) {
        const reshuffled = [...participants].sort(() => Math.random() - 0.5);
        reel = reel.concat(reshuffled);
      }
      // Place the winner near the end
      const winnerIndex = reel.length - 3;
      reel[winnerIndex] = winnerName;
      return { reel, winnerIndex };
    },
    [participants]
  );

  const spin = useCallback(() => {
    if (participants.length === 0 || isSpinning) return;

    const winnerName =
      participants[Math.floor(Math.random() * participants.length)];
    const { reel, winnerIndex } = buildReel(winnerName);

    setDisplayNames(reel);
    setGlowing(false);
    setWinner(null);
    setOffset(0);
    onSpinStart();

    // Target offset: center the winner in the visible window
    const centerSlot = Math.floor(VISIBLE_ITEMS / 2);
    const targetOffset = (winnerIndex - centerSlot) * ITEM_HEIGHT;

    const startTime = performance.now();
    let lastTickIndex = -1;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);

      // Cubic ease-out for natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentOffset = eased * targetOffset;

      setOffset(currentOffset);

      // Play tick when crossing a name boundary
      const currentIndex = Math.floor(currentOffset / ITEM_HEIGHT);
      if (currentIndex !== lastTickIndex && progress < 0.95) {
        // Pitch rises slightly as it slows
        const pitch = 600 + 400 * progress;
        playTick(pitch);
        lastTickIndex = currentIndex;
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Snap to exact position
        setOffset(targetOffset);
        setWinner(winnerName);
        setGlowing(true);
        onSpinEnd(winnerName);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [participants, isSpinning, buildReel, onSpinStart, onSpinEnd, playTick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    };
  }, []);

  // Initialize display with participant names
  useEffect(() => {
    if (participants.length > 0 && displayNames.length === 0) {
      const initial = [];
      for (let i = 0; i < VISIBLE_ITEMS + 2; i++) {
        initial.push(participants[i % participants.length]);
      }
      setDisplayNames(initial);
    }
  }, [participants, displayNames.length]);

  const viewportHeight = VISIBLE_ITEMS * ITEM_HEIGHT;

  return (
    <div className="slot-machine-container">
      <div className="slot-machine">
        {/* Gradient overlays for depth effect */}
        <div className="slot-gradient-top" />
        <div className="slot-gradient-bottom" />

        {/* Center highlight bar */}
        <div
          className={`slot-highlight ${glowing ? 'glow' : ''}`}
          style={{
            top: `${Math.floor(VISIBLE_ITEMS / 2) * ITEM_HEIGHT}px`,
            height: `${ITEM_HEIGHT}px`,
          }}
        />

        {/* Scrolling reel */}
        <div
          className="slot-viewport"
          style={{ height: `${viewportHeight}px` }}
        >
          <div
            className="slot-reel"
            style={{
              transform: `translateY(-${offset}px)`,
            }}
          >
            {displayNames.map((name, i) => (
              <div
                key={`${name}-${i}`}
                className={`slot-item ${
                  glowing && name === winner && i === displayNames.length - 3
                    ? 'winner-item'
                    : ''
                }`}
                style={{ height: `${ITEM_HEIGHT}px` }}
              >
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        className="spin-button"
        onClick={spin}
        disabled={disabled || isSpinning || participants.length === 0}
      >
        {isSpinning ? (
          <span className="spin-button-text spinning">
            <span className="spinner-icon">⟳</span> Spinning...
          </span>
        ) : participants.length === 0 ? (
          'No participants'
        ) : (
          <>
            <span className="spin-button-text">🎰 SPIN</span>
            <span className="spin-hint">or press Space</span>
          </>
        )}
      </button>
    </div>
  );
}
