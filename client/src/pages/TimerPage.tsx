import { useCallback} from 'react';
import type { Routine } from '@shared/types';
import { useTimer } from '../hooks/useTimer';
import { useSound } from '../hooks/useSound';
import { useVibration } from '../hooks/useVibration';
import { formatTime } from '../utils/time';
import { loadSettings } from '../utils/storage';
import './TimerPage.css';

interface TimerPageProps {
  routine: Routine;
  onComplete: () => void;
  onBack: () => void;
}

export function TimerPage({ routine, onComplete, onBack }: TimerPageProps) {
  const { playAlarm } = useSound();
  const { vibrate } = useVibration();
  const settings = loadSettings();

  const handleTaskComplete = useCallback(() => {
    if (settings.soundEnabled) {
      playAlarm();
    }
    if (settings.vibrationEnabled) {
      vibrate([100, 50, 100, 50, 200]);
    }
  }, [settings.soundEnabled, settings.vibrationEnabled, playAlarm, vibrate]);

  const {
    currentTaskIndex,
    remainingSeconds,
    isRunning,
    isCompleted,
    togglePlayPause,
    nextTask,
    prevTask,
    progress,
  } = useTimer(routine.tasks, handleTaskComplete);

  const currentTask = routine.tasks[currentTaskIndex];

  // 完了時に完了画面へ
  if (isCompleted) {
    // 最後のタスク完了アラーム
    setTimeout(() => onComplete(), 500);
  }

  // SVGの円形プログレスバー
  const size = 280;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="page timer-page" data-theme={routine.theme}>
      {/* ルーチン名 */}
      <header className="timer-header">
        <button className="timer-back-btn" onClick={onBack} aria-label="戻る">
          ←
        </button>
        <h1 className="timer-routine-name">{routine.name}</h1>
        <div className="timer-task-counter">
          {currentTaskIndex + 1} / {routine.tasks.length}
        </div>
      </header>

      {/* タスク名 */}
      <div className="timer-task-name fade-in" key={currentTaskIndex}>
        {currentTask?.name || ''}
      </div>

      {/* 円形プログレスバー */}
      <div className="timer-circle-container">
        <svg
          className="timer-circle-svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* トラック（背景） */}
          <circle
            className="timer-circle-track"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--progress-track)"
            strokeWidth={strokeWidth}
          />
          {/* プログレス */}
          <circle
            className="timer-circle-progress"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          {/* グラデーション定義 */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-primary)" />
              <stop offset="100%" stopColor="var(--accent-secondary)" />
            </linearGradient>
          </defs>
        </svg>

        {/* MM:SS 表示 */}
        <div className="timer-time-display">
          {formatTime(remainingSeconds)}
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="timer-controls">
        <button
          className="btn-icon btn-icon-lg timer-control-btn"
          onClick={prevTask}
          disabled={currentTaskIndex === 0}
          id="prev-task-btn"
          aria-label="前のタスク"
        >
          ＜
        </button>

        <button
          className={`btn-icon timer-play-btn ${isRunning ? 'playing' : ''}`}
          onClick={togglePlayPause}
          id="play-pause-btn"
          aria-label={isRunning ? '一時停止' : '再開'}
        >
          {isRunning ? '⏸' : '▶'}
        </button>

        <button
          className="btn-icon btn-icon-lg timer-control-btn"
          onClick={nextTask}
          disabled={currentTaskIndex >= routine.tasks.length - 1}
          id="next-task-btn"
          aria-label="次のタスク"
        >
          ＞
        </button>
      </div>

    </div>
  );
}
