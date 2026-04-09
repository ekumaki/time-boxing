import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task } from '@shared/types';
import { taskTotalSeconds } from '../utils/time';

interface UseTimerReturn {
  currentTaskIndex: number;
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
  isCompleted: boolean;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  nextTask: () => void;
  prevTask: () => void;
  progress: number; // 0 to 1
}

export function useTimer(tasks: Task[], onTaskComplete?: () => void): UseTimerReturn {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const lastTickRef = useRef<number>(Date.now());
  const intervalRef = useRef<number | null>(null);

  const currentTask = tasks[currentTaskIndex];
  const totalSeconds = currentTask ? taskTotalSeconds(currentTask.minutes, currentTask.seconds) : 0;

  // 初期化: 最初のタスクのタイマーをセット
  useEffect(() => {
    if (tasks.length > 0) {
      const firstTask = tasks[0];
      setRemainingSeconds(taskTotalSeconds(firstTask.minutes, firstTask.seconds));
      setCurrentTaskIndex(0);
      setIsRunning(false);
      setIsCompleted(false);
    }
  }, [tasks]);

  // タイマーのカウントダウン（Date.now()ベースの補正付き）
  useEffect(() => {
    if (!isRunning || isCompleted) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    lastTickRef.current = Date.now();

    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const elapsed = Math.round((now - lastTickRef.current) / 1000);
      lastTickRef.current = now;

      setRemainingSeconds((prev) => {
        const newVal = prev - elapsed;
        if (newVal <= 0) {
          return 0;
        }
        return newVal;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isCompleted]);

  // remainingSecondsが0になったら次のタスクへ
  useEffect(() => {
    if (remainingSeconds === 0 && isRunning && !isCompleted) {
      onTaskComplete?.();

      if (currentTaskIndex < tasks.length - 1) {
        const nextIndex = currentTaskIndex + 1;
        const nextTask = tasks[nextIndex];
        setCurrentTaskIndex(nextIndex);
        setRemainingSeconds(taskTotalSeconds(nextTask.minutes, nextTask.seconds));
        lastTickRef.current = Date.now();
      } else {
        // 全タスク完了
        setIsRunning(false);
        setIsCompleted(true);
      }
    }
  }, [remainingSeconds, isRunning, isCompleted, currentTaskIndex, tasks, onTaskComplete]);

  const play = useCallback(() => {
    if (!isCompleted && tasks.length > 0) {
      lastTickRef.current = Date.now();
      setIsRunning(true);
    }
  }, [isCompleted, tasks.length]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      play();
    }
  }, [isRunning, play, pause]);

  const nextTask = useCallback(() => {
    if (currentTaskIndex < tasks.length - 1) {
      const nextIndex = currentTaskIndex + 1;
      const nextT = tasks[nextIndex];
      setCurrentTaskIndex(nextIndex);
      setRemainingSeconds(taskTotalSeconds(nextT.minutes, nextT.seconds));
      lastTickRef.current = Date.now();
    }
  }, [currentTaskIndex, tasks]);

  const prevTask = useCallback(() => {
    if (currentTaskIndex > 0) {
      const prevIndex = currentTaskIndex - 1;
      const prevT = tasks[prevIndex];
      setCurrentTaskIndex(prevIndex);
      setRemainingSeconds(taskTotalSeconds(prevT.minutes, prevT.seconds));
      lastTickRef.current = Date.now();
    }
  }, [currentTaskIndex, tasks]);

  const progress = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;

  return {
    currentTaskIndex,
    remainingSeconds,
    totalSeconds,
    isRunning,
    isCompleted,
    play,
    pause,
    togglePlayPause,
    nextTask,
    prevTask,
    progress,
  };
}
