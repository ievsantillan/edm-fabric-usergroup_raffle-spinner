import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRaffle } from './useRaffle';

beforeEach(() => {
  window.localStorage.clear();
});

describe('useRaffle', () => {
  it('loadParticipants drops blanks and assigns stable ids', () => {
    const { result } = renderHook(() => useRaffle());

    act(() => {
      result.current.loadParticipants(['Homer', '', null, '  ', 'Marge', 'Bart']);
    });

    expect(result.current.allParticipants).toEqual([
      { id: 'p-0', name: 'Homer' },
      { id: 'p-1', name: 'Marge' },
      { id: 'p-2', name: 'Bart' },
    ]);
    expect(result.current.remainingParticipants).toHaveLength(3);
    expect(result.current.winners).toEqual([]);
  });

  it('confirmWinner records the win, removes from pool, and assigns the next prize', () => {
    const { result } = renderHook(() => useRaffle());

    act(() => {
      result.current.loadParticipants(['Homer', 'Marge']);
      result.current.setPrizes(['Donut', 'Coffee mug']);
    });

    act(() => {
      result.current.confirmWinner({ id: 'p-0', name: 'Homer' });
    });

    expect(result.current.winners).toEqual([
      { id: 'p-0', name: 'Homer', prize: 'Donut' },
    ]);
    expect(result.current.remainingParticipants.map((p) => p.id)).toEqual(['p-1']);
    expect(result.current.showWinner).toBe(true);
  });

  it('undoLastDraw restores the winner to the pool in original order', () => {
    const { result } = renderHook(() => useRaffle());

    act(() => {
      result.current.loadParticipants(['Homer', 'Marge', 'Bart']);
    });

    // Draw Marge (middle of the pool) so we can prove insertion preserves order.
    act(() => {
      result.current.confirmWinner({ id: 'p-1', name: 'Marge' });
    });
    expect(result.current.remainingParticipants.map((p) => p.id)).toEqual(['p-0', 'p-2']);

    act(() => {
      result.current.undoLastDraw();
    });

    expect(result.current.winners).toEqual([]);
    expect(result.current.remainingParticipants.map((p) => p.id)).toEqual([
      'p-0',
      'p-1',
      'p-2',
    ]);
  });

  it('rerollLastWinner unrecords the win but keeps the absentee out of the pool', () => {
    const { result } = renderHook(() => useRaffle());

    act(() => {
      result.current.loadParticipants(['Homer', 'Marge']);
      result.current.setPrizes(['Donut']);
      result.current.confirmWinner({ id: 'p-0', name: 'Homer' });
    });

    act(() => {
      result.current.rerollLastWinner();
    });

    // Winner record gone (so they don't appear in the export)…
    expect(result.current.winners).toEqual([]);
    // …but Homer is still filtered out of the pool because he wasn't here.
    expect(result.current.remainingParticipants.map((p) => p.id)).toEqual(['p-1']);
  });

  it('resetRaffle restores all participants and clears the winners list', () => {
    const { result } = renderHook(() => useRaffle());

    act(() => {
      result.current.loadParticipants(['Homer', 'Marge', 'Bart']);
      result.current.confirmWinner({ id: 'p-0', name: 'Homer' });
      result.current.confirmWinner({ id: 'p-1', name: 'Marge' });
    });
    expect(result.current.winners).toHaveLength(2);
    expect(result.current.remainingParticipants).toHaveLength(1);

    act(() => {
      result.current.resetRaffle();
    });

    expect(result.current.winners).toEqual([]);
    expect(result.current.remainingParticipants).toHaveLength(3);
  });
});
