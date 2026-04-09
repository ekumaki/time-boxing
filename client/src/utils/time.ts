export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function taskTotalSeconds(minutes: number, seconds: number): number {
  return minutes * 60 + seconds;
}

export function routineTotalSeconds(tasks: { minutes: number; seconds: number }[]): number {
  return tasks.reduce((sum, t) => sum + taskTotalSeconds(t.minutes, t.seconds), 0);
}

export function formatTotalTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}時間${mins}分`;
  }
  if (mins > 0) {
    return `${mins}分${secs > 0 ? `${secs}秒` : ''}`;
  }
  return `${secs}秒`;
}
