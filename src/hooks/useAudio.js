import { useCallback, useRef } from 'react';

export function useAudio() {
  const ctxRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playTick = useCallback((pitch = 800) => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = pitch;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.start(now);
    osc.stop(now + 0.06);
  }, [getCtx]);

  const playFanfare = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Ascending arpeggio: C5, E5, G5, C6
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'triangle';
      const t = now + i * 0.12;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
    });

    // Sustained chord after arpeggio
    const chordTime = now + notes.length * 0.12 + 0.05;
    [523, 659, 784, 1047].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, chordTime);
      gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.8);
      osc.start(chordTime);
      osc.stop(chordTime + 0.8);
    });
  }, [getCtx]);

  const playDrumroll = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    // Rapid soft ticks simulating a drumroll
    for (let i = 0; i < 30; i++) {
      const t = now + i * 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = 200 + Math.random() * 100;
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      osc.start(t);
      osc.stop(t + 0.03);
    }
  }, [getCtx]);

  return { playTick, playFanfare, playDrumroll };
}
