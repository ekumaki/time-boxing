import { useCallback, useRef } from 'react';

export function useSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playAlarm = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;

      // ピーッピーッというアラーム音を合成
      const playBeep = (startTime: number, frequency: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gainNode.gain.setValueAtTime(0.3, startTime + duration - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      // 3回のビープ音
      playBeep(now, 880, 0.15);
      playBeep(now + 0.25, 880, 0.15);
      playBeep(now + 0.5, 1100, 0.3);
    } catch {
      // Web Audio API非対応の場合は無視
    }
  }, []);

  return { playAlarm };
}
