import { useState, useCallback } from 'react';

export function useRaffle() {
  const [allParticipants, setAllParticipants] = useState([]);
  const [remainingParticipants, setRemainingParticipants] = useState([]);
  const [winners, setWinners] = useState([]);
  const [currentWinner, setCurrentWinner] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinner, setShowWinner] = useState(false);

  const loadParticipants = useCallback((names) => {
    const unique = [...new Set(names.filter((n) => n && String(n).trim()))].map(
      (n) => String(n).trim()
    );
    setAllParticipants(unique);
    setRemainingParticipants(unique);
    setWinners([]);
    setCurrentWinner(null);
    setShowWinner(false);
  }, []);

  const pickWinner = useCallback(() => {
    if (remainingParticipants.length === 0 || isSpinning) return null;
    const idx = Math.floor(Math.random() * remainingParticipants.length);
    return remainingParticipants[idx];
  }, [remainingParticipants, isSpinning]);

  const confirmWinner = useCallback(
    (winner) => {
      setWinners((prev) => [...prev, winner]);
      setRemainingParticipants((prev) => prev.filter((p) => p !== winner));
      setCurrentWinner(winner);
      setShowWinner(true);
    },
    []
  );

  const dismissWinner = useCallback(() => {
    setShowWinner(false);
  }, []);

  const resetRaffle = useCallback(() => {
    setRemainingParticipants([...allParticipants]);
    setWinners([]);
    setCurrentWinner(null);
    setShowWinner(false);
  }, [allParticipants]);

  return {
    allParticipants,
    remainingParticipants,
    winners,
    currentWinner,
    isSpinning,
    showWinner,
    setIsSpinning,
    loadParticipants,
    pickWinner,
    confirmWinner,
    dismissWinner,
    resetRaffle,
  };
}
