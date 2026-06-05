import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadJson, saveJson } from '../utils/storage';

const STORAGE_KEY = 'raffle';

// Persisted shape. Participants and winners are now identified by a stable
// `id` so duplicate names (two attendees called "John Smith") are treated as
// distinct entries — picking one no longer removes the other from the pool.
//   - participants: { id: string, name: string }[]
//   - winners:      { id: string|null, name: string, prize: string|null }[]
//     (id is nullable to tolerate legacy data; in practice it's always set
//      for new draws.)
const EMPTY_STATE = {
  allParticipants: [],
  remainingParticipants: [],
  winners: [],
  prizes: [],
};

function isParticipantObject(x) {
  return x && typeof x === 'object' && typeof x.id === 'string' && typeof x.name === 'string';
}

function loadInitialState() {
  const saved = loadJson(STORAGE_KEY, null);
  if (!saved || typeof saved !== 'object') return EMPTY_STATE;
  // Defensive: ensure each field exists and every participant is a {id, name}.
  // Anything that isn't the right shape is dropped rather than crashing.
  const allParticipants = Array.isArray(saved.allParticipants)
    ? saved.allParticipants.filter(isParticipantObject)
    : [];
  const remainingParticipants = Array.isArray(saved.remainingParticipants)
    ? saved.remainingParticipants.filter(isParticipantObject)
    : [];
  const winners = Array.isArray(saved.winners) ? saved.winners : [];
  const prizes = Array.isArray(saved.prizes) ? saved.prizes : [];
  return { allParticipants, remainingParticipants, winners, prizes };
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

  // Build the canonical participant list. Drops blanks and assigns each row a
  // stable synthetic id derived from its load-order index so duplicate names
  // remain distinct entities throughout the raffle.
  const loadParticipants = useCallback((names) => {
    const cleaned = names
      .map((n) => (n == null ? '' : String(n).trim()))
      .filter(Boolean)
      .map((name, i) => ({ id: `p-${i}`, name }));
    setPersisted((prev) => ({
      ...prev,
      allParticipants: cleaned,
      remainingParticipants: cleaned,
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

  // Pick a random participant from the remaining pool without mutating state.
  // Returns the full {id, name} object so the caller can match by id later
  // (essential when two participants share a name).
  const pickWinner = useCallback(() => {
    if (remainingParticipants.length === 0 || isSpinning) return null;
    const idx = Math.floor(Math.random() * remainingParticipants.length);
    return remainingParticipants[idx];
  }, [remainingParticipants, isSpinning]);

  // Confirm a draw. Accepts a participant object {id, name} so we filter by id
  // — duplicate-name participants are no longer accidentally both removed.
  const confirmWinner = useCallback((participant) => {
    if (!participant || typeof participant !== 'object' || !participant.id) {
      // Should not happen with the current SlotMachine, but guard anyway so a
      // malformed call doesn't corrupt the pool.
      return;
    }
    setPersisted((prev) => {
      const prize = prev.prizes[prev.winners.length] ?? null;
      return {
        ...prev,
        winners: [
          ...prev.winners,
          { id: participant.id, name: participant.name, prize },
        ],
        remainingParticipants: prev.remainingParticipants.filter(
          (p) => p.id !== participant.id
        ),
      };
    });
    setCurrentWinner(participant);
    setShowWinner(true);
  }, []);

  const dismissWinner = useCallback(() => {
    setShowWinner(false);
  }, []);

  // Override the prize assigned to the most recent winner. Used by the in-
  // overlay prize dropdown so the organizer can swap the auto-assigned prize
  // (which defaults to the next slot in the queue) before moving on.
  const updateLastWinnerPrize = useCallback((prize) => {
    setPersisted((prev) => {
      if (prev.winners.length === 0) return prev;
      const next = prev.winners.slice();
      const last = next[next.length - 1];
      next[next.length - 1] = { ...last, prize: prize || null };
      return { ...prev, winners: next };
    });
  }, []);

  // "Not here, re-roll" — the just-picked person is absent. We unrecord the
  // win (so it doesn't appear in the winners list / export) but we KEEP them
  // removed from `remainingParticipants` so they can't be picked again. The
  // prize index automatically rolls back since it's derived from winners.length,
  // so the next draw lands on the same prize.
  const rerollLastWinner = useCallback(() => {
    setPersisted((prev) => {
      if (prev.winners.length === 0) return prev;
      return { ...prev, winners: prev.winners.slice(0, -1) };
    });
    setCurrentWinner(null);
    setShowWinner(false);
  }, []);

  // Undo the last draw entirely — unlike re-roll, this puts the person BACK
  // in the pool so they can be picked again. Use case: organizer drew for the
  // wrong prize category, hit Continue, then realised the mistake. The
  // restored participant is re-inserted in their original load-order position
  // so the visible pool order stays stable across undos. Falls back to a
  // simple append for legacy winner records that have no `id`.
  const undoLastDraw = useCallback(() => {
    setPersisted((prev) => {
      if (prev.winners.length === 0) return prev;
      const lastWinner = prev.winners[prev.winners.length - 1];
      const nextWinners = prev.winners.slice(0, -1);
      if (!lastWinner.id) {
        // Legacy data with no id — we can't safely match against allParticipants,
        // so just drop the winner record and leave the pool alone. Better than
        // re-adding a phantom entry.
        return { ...prev, winners: nextWinners };
      }
      const original = prev.allParticipants.find((p) => p.id === lastWinner.id);
      if (!original) {
        // Participant no longer in the master list (shouldn't happen, but
        // guard for forward-compat). Drop the winner only.
        return { ...prev, winners: nextWinners };
      }
      // Already in the pool? Shouldn't be possible (a winner can't also be
      // remaining), but make the op idempotent just in case.
      if (prev.remainingParticipants.some((p) => p.id === original.id)) {
        return { ...prev, winners: nextWinners };
      }
      // Insert at the position that preserves allParticipants order. Find the
      // first remaining participant whose original index is greater than ours
      // and slot in before them.
      const originalIdx = prev.allParticipants.indexOf(original);
      const nextRemaining = prev.remainingParticipants.slice();
      let insertAt = nextRemaining.findIndex(
        (p) => prev.allParticipants.indexOf(p) > originalIdx
      );
      if (insertAt === -1) insertAt = nextRemaining.length;
      nextRemaining.splice(insertAt, 0, original);
      return {
        ...prev,
        winners: nextWinners,
        remainingParticipants: nextRemaining,
      };
    });
    setCurrentWinner(null);
    setShowWinner(false);
  }, []);

  // Reorder the UNAWARDED tail of the prize list. The first `winners.length`
  // prizes are locked (already given out) and any reorder request that
  // touches them is rejected. Indices are relative to the unawarded slice,
  // so 0 = next prize, 1 = the one after that, etc. — matches what the UI
  // shows in the "Upcoming prizes" panel.
  const reorderRemainingPrizes = useCallback((fromIdx, toIdx) => {
    setPersisted((prev) => {
      const awardedCount = prev.winners.length;
      const remaining = prev.prizes.slice(awardedCount);
      if (
        fromIdx < 0 ||
        toIdx < 0 ||
        fromIdx >= remaining.length ||
        toIdx >= remaining.length ||
        fromIdx === toIdx
      ) {
        return prev;
      }
      const reordered = remaining.slice();
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      return {
        ...prev,
        prizes: [...prev.prizes.slice(0, awardedCount), ...reordered],
      };
    });
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
    updateLastWinnerPrize,
    rerollLastWinner,
    undoLastDraw,
    reorderRemainingPrizes,
    resetRaffle,
    clearAll,
  };
}
