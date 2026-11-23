/** A short, pleasant two-note chime generated with WebAudio (no audio assets, no network). */
export function playChime(volume = 0.18): void {
  try {
    const Ctx: typeof AudioContext | undefined =
      typeof window !== 'undefined' ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = [659.25, 880];
    notes.forEach((frequency, index) => {
      const start = ctx.currentTime + index * 0.22;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1);
    });
    setTimeout(() => void ctx.close(), 1800);
  } catch {
    /* audio is a nicety, never fatal */
  }
}
