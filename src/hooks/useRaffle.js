import { useCallback, useMemo, useState } from 'react';

export function useRaffle() {
  const [allParticipants, setAllParticipants] = useState([]);
  const [remainingParticipants, setRemainingParticipants] = useState([]);
  // `winners` is always an array of { name, prize } objects. `prize` is null
  // when the organizer didn't configure prize labels for this raffle.
  const [winners, setWinners] = useState([]);
  const [currentWinner, setCurrentWinner] = useState(null);
  const [prizes, setPrizesState] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  // Bumped on every load/reset so consumers can use it as a React `key`
  // to force a clean remount of stateful child components (e.g. SlotMachine).
  const [sessionId, setSessionId] = useState(0);

  const loadParticipants = useCallback((names) => {
    const unique = [...new Set(names.filter((n) => n && String(n).trim()))].map(
      (n) => String(n).trim()
    );
    setAllParticipants(unique);
    setRemainingParticipants(unique);
    setWinners([]);
    setCurrentWinner(null);
    setShowWinner(false);
    setSessionId((id) => id + 1);
  }, []);

  // Replace the ordered prize list. Trims, drops blanks, preserves order.
  // Pass [] (or omit) for the default "no prize labels" raffle.
  const setPrizes = useCallback((next) => {
    const cleaned = (next ?? [])
      .map((p) => String(p ?? '').trim())
      .filter(Boolean);
    setPrizesState(cleaned);
  }, []);

  // Pick a random winner from the remaining pool without mutating state.
  // Returns null when the pool is empty or a spin is already in flight.
  const pickWinner = useCallback(() => {
    if (remainingParticipants.length === 0 || isSpinning) return null;
    const idx = Math.floor(Math.random() * remainingParticipants.length);
    return remainingParticipants[idx];
  }, [remainingParticipants, isSpinning]);

  const confirmWinner = useCallback((name) => {
    setWinners((prev) => {
      const prize = prizes[prev.length] ?? null;
      return [...prev, { name, prize }];
    });
    setRemainingParticipants((prev) => prev.filter((p) => p !== name));
    setCurrentWinner(name);
    setShowWinner(true);
  }, [prizes]);

  const dismissWinner = useCallback(() => {
    setShowWinner(false);
  }, []);

  const resetRaffle = useCallback(() => {
    setRemainingParticipants([...allParticipants]);
    setWinners([]);
    setCurrentWinner(null);
    setShowWinner(false);
    setSessionId((id) => id + 1);
  }, [allParticipants]);

  // Derived prize state — exposed so the UI can label the next draw, show
  // progress ("Prize 2 of 5"), and lock the SPIN button when the prize list
  // is exhausted.
  const { currentPrize, allPrizesAwarded, prizeProgress } = useMemo(() => {
    if (prizes.length === 0) {
      return { currentPrize: null, allPrizesAwarded: false, prizeProgress: null };
    }
    const idx = winners.length;
    return {
      currentPrize: prizes[idx] ?? null,
      allPrizesAwarded: idx >= prizes.length,
      prizeProgress: {
        current: Math.min(idx + 1, prizes.length),
        total: prizes.length,
      },
    };
  }, [prizes, winners.length]);

  return {
    allParticipants,
    remainingParticipants,
    winners,
    currentWinner,
    prizes,
    currentPrize,
    allPrizesAwarded,
    prizeProgress,
    isSpinning,
    showWinner,
    sessionId,
    setIsSpinning,
    setPrizes,
    loadParticipants,
    pickWinner,
    confirmWinner,
    dismissWinner,
    resetRaffle,
  };
}
