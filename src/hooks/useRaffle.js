import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadJson, saveJson } from '../utils/storage';

const STORAGE_KEY = 'raffle';

// Shape we persist to localStorage. Only includes data needed to resume a
// raffle in progress — transient UI flags (isSpinning, showWinner, etc.)
// always reset on reload because they describe in-flight animations.
const EMPTY_STATE = {
  allParticipants: [],
  remainingParticipants: [],
  winners: [],
  prizes: [],
};

function loadInitialState() {
  const saved = loadJson(STORAGE_KEY, null);
  if (!saved || typeof saved !== 'object') return EMPTY_STATE;
  // Defensive: ensure each field exists and is an array. Persisted shape
  // changes should bump the storage version key instead of being patched
  // here, but a stray missing field shouldn't crash the app.
  return {
    allParticipants: Array.isArray(saved.allParticipants) ? saved.allParticipants : [],
    remainingParticipants: Array.isArray(saved.remainingParticipants) ? saved.remainingParticipants : [],
    winners: Array.isArray(saved.winners) ? saved.winners : [],
    prizes: Array.isArray(saved.prizes) ? saved.prizes : [],
  };
}

export function useRaffle() {
  // Lazy initializer so we only hit localStorage once on mount.
  const [persisted, setPersisted] = useState(loadInitialState);

  const { allParticipants, remainingParticipants, winners, prizes } = persisted;

  const [currentWinner, setCurrentWinner] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  // Bumped on every load/reset so consumers can use it as a React `key`
  // to force a clean remount of stateful child components (e.g. SlotMachine).
  const [sessionId, setSessionId] = useState(0);

  // Persist the slice that matters whenever it changes. saveJson is silent on
  // failure (quota, private mode) so this is safe to fire on every render.
  useEffect(() => {
    saveJson(STORAGE_KEY, persisted);
  }, [persisted]);

  const loadParticipants = useCallback((names) => {
    const unique = [...new Set(names.filter((n) => n && String(n).trim()))].map(
      (n) => String(n).trim()
    );
    setPersisted((prev) => ({
      ...prev,
      allParticipants: unique,
      remainingParticipants: unique,
      winners: [],
    }));
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
    setPersisted((prev) => ({ ...prev, prizes: cleaned }));
  }, []);

  // Pick a random winner from the remaining pool without mutating state.
  // Returns null when the pool is empty or a spin is already in flight.
  const pickWinner = useCallback(() => {
    if (remainingParticipants.length === 0 || isSpinning) return null;
    const idx = Math.floor(Math.random() * remainingParticipants.length);
    return remainingParticipants[idx];
  }, [remainingParticipants, isSpinning]);

  const confirmWinner = useCallback((name) => {
    setPersisted((prev) => {
      const prize = prev.prizes[prev.winners.length] ?? null;
      return {
        ...prev,
        winners: [...prev.winners, { name, prize }],
        remainingParticipants: prev.remainingParticipants.filter((p) => p !== name),
      };
    });
    setCurrentWinner(name);
    setShowWinner(true);
  }, []);

  const dismissWinner = useCallback(() => {
    setShowWinner(false);
  }, []);

  const resetRaffle = useCallback(() => {
    setPersisted((prev) => ({
      ...prev,
      remainingParticipants: [...prev.allParticipants],
      winners: [],
    }));
    setCurrentWinner(null);
    setShowWinner(false);
    setSessionId((id) => id + 1);
  }, []);

  // Full wipe — used by "Start fresh" / "Load New File". Clears every persisted
  // field including participants and prizes so the next mount starts at upload.
  const clearAll = useCallback(() => {
    setPersisted(EMPTY_STATE);
    setCurrentWinner(null);
    setShowWinner(false);
    setSessionId((id) => id + 1);
  }, []);

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
    clearAll,
  };
}
