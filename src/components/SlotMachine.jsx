import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

const ITEM_HEIGHT = 80;
const VISIBLE_ITEMS = 5;
const SPIN_DURATION = 4000; // ms
const WINNER_OFFSET_FROM_END = 3; // distance from the end of the reel where the winner sits

// Synchronous check; safe in event handlers (re-evaluated on every spin so the
// user can flip the OS-level setting mid-session and have it take effect).
function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const SlotMachine = forwardRef(function SlotMachine(
  {
    participants, // {id, name}[]
    isSpinning,
    onSpinStart,
    onSpinEnd,
    pickWinner,
    playTick,
    disabled,
  },
  ref
) {
  // Lazy initializer: seed the reel with the first few participants so the
  // viewport isn't empty before the first spin. SlotMachine is remounted
  // (via `key={sessionId}` in the parent) whenever a new file is loaded or
  // the raffle is reset, so this initializer re-runs at the right moments.
  const [displayItems, setDisplayItems] = useState(() => {
    if (participants.length === 0) return [];
    const seed = [];
    for (let i = 0; i < VISIBLE_ITEMS + 2; i++) {
      seed.push(participants[i % participants.length]);
    }
    return seed;
  });
  const [offset, setOffset] = useState(0);
  const [winnerId, setWinnerId] = useState(null);
  const [winnerIndex, setWinnerIndex] = useState(-1);
  const [glowing, setGlowing] = useState(false);
  const animRef = useRef(null);
  const spinButtonRef = useRef(null);

  // Build a long repeating reel with the winner placed at a fixed slot near
  // the end. The pool excludes the winner so the winning entry never appears
  // twice on the reel (which would let the user see it flash by mid-spin).
  // We filter by id so duplicate-name participants stay in the reel.
  const buildReel = useCallback(
    (winnerParticipant) => {
      const pool = participants.filter((p) => p.id !== winnerParticipant.id);
      const segmentSize = Math.max(pool.length, 1);
      const reps = Math.max(10, Math.ceil(80 / segmentSize));
      let reel = [];
      for (let i = 0; i < reps; i++) {
        const segment =
          pool.length > 0
            ? [...pool].sort(() => Math.random() - 0.5)
            : [winnerParticipant]; // edge case: only one participant remaining
        reel = reel.concat(segment);
      }
      const idx = reel.length - WINNER_OFFSET_FROM_END;
      reel[idx] = winnerParticipant;
      return { reel, winnerIndex: idx };
    },
    [participants]
  );

  const spin = useCallback(() => {
    if (participants.length === 0 || isSpinning) return;

    const winnerParticipant = pickWinner ? pickWinner() : null;
    if (!winnerParticipant) return;

    const { reel, winnerIndex: idx } = buildReel(winnerParticipant);

    setDisplayItems(reel);
    setWinnerIndex(idx);
    setGlowing(false);
    setWinnerId(null);
    setOffset(0);
    onSpinStart();

    // Honor the user's OS-level motion preference. We still want a visible
    // result — just skip the long animation + ticks and reveal the winner
    // immediately. The parent's WinnerDisplay handles its own animation
    // reduction (via framer-motion + reduced-motion media query).
    if (prefersReducedMotion()) {
      // Centre the winner in the viewport without animating to it.
      const centerSlot = Math.floor(VISIBLE_ITEMS / 2);
      const targetOffset = (idx - centerSlot) * ITEM_HEIGHT;
      setOffset(targetOffset);
      setWinnerId(winnerParticipant.id);
      setGlowing(true);
      onSpinEnd(winnerParticipant);
      return;
    }

    // Target offset: centre the winner in the visible window
    const centerSlot = Math.floor(VISIBLE_ITEMS / 2);
    const targetOffset = (idx - centerSlot) * ITEM_HEIGHT;

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
        const pitch = 600 + 400 * progress;
        playTick(pitch);
        lastTickIndex = currentIndex;
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setOffset(targetOffset);
        setWinnerId(winnerParticipant.id);
        setGlowing(true);
        onSpinEnd(winnerParticipant);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [participants, isSpinning, pickWinner, buildReel, onSpinStart, onSpinEnd, playTick]);

  // Expose spin() and focusSpinButton() to the parent so keyboard shortcuts
  // can trigger a spin and focus can be restored after the winner overlay
  // closes.
  useImperativeHandle(
    ref,
    () => ({
      spin,
      focusSpinButton: () => spinButtonRef.current?.focus(),
    }),
    [spin]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

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
          aria-hidden="true"
        >
          <div
            className="slot-reel"
            style={{
              transform: `translateY(-${offset}px)`,
            }}
          >
            {displayItems.map((p, i) => (
              <div
                key={`${p.id}-${i}`}
                className={`slot-item ${
                  glowing && p.id === winnerId && i === winnerIndex
                    ? 'winner-item'
                    : ''
                }`}
                style={{ height: `${ITEM_HEIGHT}px` }}
              >
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        ref={spinButtonRef}
        className="spin-button"
        onClick={spin}
        disabled={disabled || isSpinning || participants.length === 0}
        aria-keyshortcuts="Space"
      >
        {isSpinning ? (
          <span className="spin-button-text spinning">
            <span className="spinner-icon" aria-hidden="true">⟳</span> Spinning...
          </span>
        ) : participants.length === 0 ? (
          'No participants'
        ) : (
          <>
            <span className="spin-button-text" aria-hidden="true">🎰 SPIN</span>
            <span className="spin-hint">or press Space</span>
          </>
        )}
      </button>
    </div>
  );
});

export default SlotMachine;
