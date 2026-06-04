import { useState, useCallback } from 'react';

export function useRaffle() {
  const [allParticipants, setAllParticipants] = useState([]);
  const [remainingParticipants, setRemainingParticipants] = useState([]);
  const [winners, setWinners] = useState([]);
  const [currentWinner, setCurrentWinner] = useState(null);
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

  // Pick a random winner from the remaining pool without mutating state.
  // Returns null when the pool is empty or a spin is already in flight.
  const pickWinner = useCallback(() => {
    if (remainingParticipants.length === 0 || isSpinning) return null;
    const idx = Math.floor(Math.random() * remainingParticipants.length);
    return remainingParticipants[idx];
  }, [remainingParticipants, isSpinning]);

  const confirmWinner = useCallback((winner) => {
    setWinners((prev) => [...prev, winner]);
    setRemainingParticipants((prev) => prev.filter((p) => p !== winner));
    setCurrentWinner(winner);
    setShowWinner(true);
  }, []);

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

  return {
    allParticipants,
    remainingParticipants,
    winners,
    currentWinner,
    isSpinning,
    showWinner,
    sessionId,
    setIsSpinning,
    loadParticipants,
    pickWinner,
    confirmWinner,
    dismissWinner,
    resetRaffle,
  };
}
