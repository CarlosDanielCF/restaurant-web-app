/** Authoritative snapshots seed silently on first load and reconnection. */
export class KitchenSoundTracker {
  private baseline = false;
  private seen = new Set<string>();
  reset() {
    this.baseline = false;
  }
  observe(dispatches: string[], notices: string[]) {
    const keys = [
      ...dispatches.map((id) => `dispatch:${id}`),
      ...notices.map((id) => `notice:${id}`)
    ];
    const fresh = this.baseline && keys.some((key) => !this.seen.has(key));
    keys.forEach((key) => this.seen.add(key));
    this.baseline = true;
    return fresh;
  }
}
/** Must be unlocked by an explicit gesture. Never resume automatically. */
export function playKitchenTone(context: AudioContext) {
  try {
    if (context.state !== 'running') return false;
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    const now = context.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    oscillator.frequency.value = 880;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(now);
    oscillator.stop(now + 0.35);
    return true;
  } catch {
    return false;
  }
}
