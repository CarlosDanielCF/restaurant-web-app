import { useRef, useCallback, useState, useEffect } from 'react';

const preferenceEvent = 'notification-sound-preference';

/** Historical notifications use a local synthesized tone, never a network/cache asset. */
export const useNotificationSound = (volume = 0.5) => {
  const context = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState(
    () => localStorage.getItem('notificationSoundMuted') === 'true'
  );
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const unlock = useCallback(async () => {
    try {
      const Audio = window.AudioContext;
      if (!Audio) return;
      context.current ??= new Audio();
      if (context.current.state === 'suspended') await context.current.resume();
      setIsAudioEnabled(context.current.state === 'running');
    } catch {
      setIsAudioEnabled(false);
    }
  }, []);

  useEffect(() => {
    const synchronize = () =>
      setIsMuted(localStorage.getItem('notificationSoundMuted') === 'true');
    const enable = () => {
      if (localStorage.getItem('notificationSoundMuted') !== 'true')
        void unlock();
    };
    window.addEventListener(preferenceEvent, synchronize);
    window.addEventListener('storage', synchronize);
    window.addEventListener('pointerdown', enable, { once: true });
    window.addEventListener('keydown', enable, { once: true });
    return () => {
      window.removeEventListener(preferenceEvent, synchronize);
      window.removeEventListener('storage', synchronize);
      window.removeEventListener('pointerdown', enable);
      window.removeEventListener('keydown', enable);
      const current = context.current;
      context.current = null;
      if (current && current.state !== 'closed') void current.close();
    };
  }, [unlock]);

  const play = useCallback(async () => {
    if (localStorage.getItem('notificationSoundMuted') === 'true') return;
    const audio = context.current;
    // Browser autoplay permission is obtained only from a user interaction.
    if (!audio || audio.state !== 'running') return;
    try {
      [800, 600].forEach((frequency, index) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        const start = audio.currentTime + index * 0.15;
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(
          Math.max(0.01, Math.min(1, volume)),
          start + 0.01
        );
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start(start);
        oscillator.stop(start + 0.16);
      });
    } catch {
      setIsAudioEnabled(false);
    }
  }, [volume]);

  const setMute = useCallback(
    (mute: boolean) => {
      localStorage.setItem('notificationSoundMuted', String(mute));
      setIsMuted(mute);
      window.dispatchEvent(new Event(preferenceEvent));
      if (!mute) void unlock();
    },
    [unlock]
  );
  const toggleMute = useCallback(() => {
    setMute(localStorage.getItem('notificationSoundMuted') !== 'true');
  }, [setMute]);

  return { play, isMuted, toggleMute, setMute, isAudioEnabled };
};
