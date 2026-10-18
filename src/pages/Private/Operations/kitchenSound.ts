/** Authoritative snapshots seed silently on first load and reconnection. */
export class KitchenSoundTracker {
  private baseline = false;
  private seen = new Set<string>();
  reset() {
    this.baseline = false;
  }
  observe(dispatches: string[], notices: string[]) {
    const changes = this.observeChanges(dispatches, notices);
    return changes.dispatches > 0 || changes.notices > 0;
  }
  observeChanges(dispatches: string[], notices: string[]) {
    const keys = [
      ...dispatches.map((id) => `dispatch:${id}`),
      ...notices.map((id) => `notice:${id}`)
    ];
    const fresh = {
      dispatches: this.baseline
        ? dispatches.filter((id) => !this.seen.has(`dispatch:${id}`)).length
        : 0,
      notices: this.baseline
        ? notices.filter((id) => !this.seen.has(`notice:${id}`)).length
        : 0
    };
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

/** SpeechSynthesis exposes no standardized gender attribute. Prefer known Spanish male voices, otherwise a Spanish voice. */
export function announceIncoming(
  synth: SpeechSynthesis,
  create: () => SpeechSynthesisUtterance
): boolean {
  try {
    const voices = synth.getVoices().filter((v) => /^es(?:-|_)/i.test(v.lang));
    if (!voices.length) return false;
    const voice =
      voices.find((v) =>
        /(?:jorge|pablo|diego|carlos|enrique|alvaro|álvaro|raul|raúl|andres|andrés|\bmale\b|masculin)/i.test(
          v.name
        )
      ) || voices[0];
    const utterance = create();
    utterance.text = 'Pedido entrante';
    utterance.lang = voice.lang;
    utterance.voice = voice;
    utterance.volume = 1;
    utterance.rate = 1;
    synth.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
