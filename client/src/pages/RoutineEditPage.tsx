import { useState, useEffect } from 'react';
import type { Routine, ThemeType } from '@shared/types';
import { api } from '../api/client';
import { routineTotalSeconds, formatTotalTime } from '../utils/time';
import './RoutineEditPage.css';

interface RoutineEditPageProps {
  routine?: Routine;
  onSave: () => void;
  onBack: () => void;
}

interface TaskForm {
  tempId: string;
  name: string;
  minutes: number;
  seconds: number;
}

const THEMES: { id: ThemeType; label: string }[] = [
  { id: 'light', label: 'ライト' },
  { id: 'dark', label: 'ネオン' },
  { id: 'pop', label: 'ポップ' },
  { id: 'rock', label: 'ロック' },
];

let tempIdCounter = 0;
function nextTempId() {
  return `temp-${++tempIdCounter}`;
}

export function RoutineEditPage({ routine, onSave, onBack }: RoutineEditPageProps) {
  const [name, setName] = useState('');
  const [theme, setTheme] = useState<ThemeType>('light');
  const [tasks, setTasks] = useState<TaskForm[]>([]);
  const [saving, setSaving] = useState(false);

  const isEditing = !!routine;

  useEffect(() => {
    if (routine) {
      setName(routine.name);
      setTheme(routine.theme);
      setTasks(
        routine.tasks.map((t) => ({
          tempId: nextTempId(),
          name: t.name,
          minutes: t.minutes,
          seconds: t.seconds,
        }))
      );
    } else {
      setName('');
      setTheme('light');
      setTasks([{ tempId: nextTempId(), name: '', minutes: 1, seconds: 0 }]);
    }
  }, [routine]);

  const addTask = () => {
    setTasks([...tasks, { tempId: nextTempId(), name: '', minutes: 1, seconds: 0 }]);
  };

  const removeTask = (tempId: string) => {
    if (tasks.length <= 1) return;
    setTasks(tasks.filter((t) => t.tempId !== tempId));
  };

  const updateTask = (tempId: string, field: keyof TaskForm, value: string | number) => {
    setTasks(tasks.map((t) => (t.tempId === tempId ? { ...t, [field]: value } : t)));
  };

  const moveTask = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tasks.length) return;
    const newTasks = [...tasks];
    [newTasks[index], newTasks[newIndex]] = [newTasks[newIndex], newTasks[index]];
    setTasks(newTasks);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('ルーチン名を入力してください。');
      return;
    }

    if (tasks.some((t) => !t.name.trim())) {
      alert('すべてのタスクに名前を入力してください。');
      return;
    }

    setSaving(true);
    try {
      const taskData = tasks.map((t, i) => ({
        name: t.name,
        minutes: Number(t.minutes) || 0,
        seconds: Number(t.seconds) || 0,
        order: i,
      }));

      if (isEditing && routine) {
        await api.updateRoutine(routine.id, { name, theme, tasks: taskData });
      } else {
        await api.createRoutine({ name, theme, tasks: taskData });
      }
      onSave();
    } catch (err: any) {
      alert('保存に失敗しました: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalSecs = routineTotalSeconds(tasks.map((t) => ({ minutes: Number(t.minutes) || 0, seconds: Number(t.seconds) || 0 })));

  return (
    <div className="page edit-page" data-theme="light">
      <header className="page-header">
        <button className="btn-icon" onClick={onBack} aria-label="戻る" id="edit-back-btn">
          ←
        </button>
        <h1 className="page-title edit-title">{isEditing ? 'ルーチン編集' : 'ルーチン作成'}</h1>
        <div style={{ width: 48 }} />
      </header>

      {/* ルーチン名 */}
      <div className="form-section">
        <label className="form-label" htmlFor="routine-name">ルーチン名</label>
        <input
          id="routine-name"
          className="input"
          type="text"
          placeholder="例: 朝起きたら 😊"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
        />
      </div>

      {/* テーマ選択 */}
      <div className="form-section">
        <label className="form-label">デザインテーマ</label>
        <div className="theme-selector">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`theme-option ${theme === t.id ? 'selected' : ''}`}
              data-theme-preview={t.id}
              onClick={() => setTheme(t.id)}
              id={`theme-${t.id}`}
            >
              <span className="theme-label">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* タスク一覧 */}
      <div className="form-section">
        <div className="form-label-row">
          <label className="form-label">タスク</label>
          <span className="total-time">合計: {formatTotalTime(totalSecs)}</span>
        </div>

        <div className="task-list">
          {tasks.map((task, index) => (
            <div key={task.tempId} className="task-item card">
              <div className="task-item-header">
                <span className="task-number">{index + 1}</span>
                <div className="task-move-btns">
                  <button
                    className="btn-icon-sm"
                    onClick={() => moveTask(index, 'up')}
                    disabled={index === 0}
                    aria-label="上へ"
                  >↑</button>
                  <button
                    className="btn-icon-sm"
                    onClick={() => moveTask(index, 'down')}
                    disabled={index === tasks.length - 1}
                    aria-label="下へ"
                  >↓</button>
                </div>
                <button
                  className="btn-icon-sm task-delete"
                  onClick={() => removeTask(task.tempId)}
                  disabled={tasks.length <= 1}
                  aria-label="タスク削除"
                >✕</button>
              </div>
              <input
                className="input task-name-input"
                type="text"
                placeholder="タスク名"
                value={task.name}
                onChange={(e) => updateTask(task.tempId, 'name', e.target.value)}
                maxLength={30}
              />
              <div className="task-time-row">
                <div className="task-time-input">
                  <input
                    className="input time-input"
                    type="number"
                    min="0"
                    max="99"
                    value={task.minutes}
                    onChange={(e) => updateTask(task.tempId, 'minutes', Number(e.target.value))}
                  />
                  <span className="time-label">分</span>
                </div>
                <div className="task-time-input">
                  <input
                    className="input time-input"
                    type="number"
                    min="0"
                    max="59"
                    value={task.seconds}
                    onChange={(e) => updateTask(task.tempId, 'seconds', Number(e.target.value))}
                  />
                  <span className="time-label">秒</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-secondary add-task-btn" onClick={addTask} id="add-task-btn">
          ＋ タスクを追加
        </button>
      </div>

      {/* 保存ボタン */}
      <button
        className="btn btn-primary save-btn"
        onClick={handleSave}
        disabled={saving}
        id="save-routine-btn"
      >
        {saving ? '保存中...' : isEditing ? '更新' : '作成'}
      </button>
    </div>
  );
}
