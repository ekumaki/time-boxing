import { useState, useEffect } from 'react';
import type { Routine } from '@shared/types';
import { api } from '../api/client';
import { routineTotalSeconds, formatTotalTime } from '../utils/time';
import './HomePage.css';

interface HomePageProps {
  onNavigateToTimer: (routine: Routine) => void;
  onNavigateToEdit: (routine?: Routine) => void;
  onNavigateToSettings: () => void;
}

export function HomePage({ onNavigateToTimer, onNavigateToEdit, onNavigateToSettings }: HomePageProps) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Routine | null>(null);

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      const data = await api.getRoutines();
      setRoutines(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteRoutine(deleteTarget.id);
      setRoutines((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert('削除に失敗しました: ' + err.message);
    }
  };

  const themeLabels: Record<string, string> = {
    light: 'ライト',
    dark: 'ネオン',
    pop: 'ポップ',
    rock: 'ロック',
  };

  return (
    <div className="page home-page" data-theme="light">
      <header className="page-header">
        <h1 className="page-title home-title">タイムボクシング</h1>
        <button
          className="btn-icon"
          onClick={onNavigateToSettings}
          id="settings-btn"
          aria-label="設定"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>読み込み中...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button className="btn btn-secondary" onClick={fetchRoutines}>再試行</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="routine-list">
            {routines.length === 0 ? (
              <div className="empty-state fade-in">
                <div className="empty-icon">📋</div>
                <p className="empty-text">ルーチンがありません</p>
                <p className="empty-subtext">「＋」ボタンから最初のルーチンを作成しましょう</p>
              </div>
            ) : (
              routines.map((routine, index) => (
                <div
                  key={routine.id}
                  className="routine-card card slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => onNavigateToTimer(routine)}
                  id={`routine-card-${routine.id}`}
                >
                  <div className="routine-card-header">
                    <h2 className="routine-card-name">{routine.name}</h2>
                    <div className="routine-card-actions">
                      <button
                        className="btn-icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToEdit(routine);
                        }}
                        aria-label="編集"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c6d7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="btn-icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(routine);
                        }}
                        aria-label="削除"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c6d7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="routine-card-meta">
                    <span className="routine-card-theme">{themeLabels[routine.theme] || routine.theme}</span>
                    <span className="routine-card-info">
                      {routine.tasks.length}タスク・{formatTotalTime(routineTotalSeconds(routine.tasks))}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            className="fab"
            onClick={() => onNavigateToEdit()}
            id="add-routine-btn"
            aria-label="ルーチン追加"
          >
            ＋
          </button>
        </>
      )}

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">ルーチンの削除</h3>
            <p>「{deleteTarget.name}」を削除しますか？</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              この操作は取り消せません。
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                キャンセル
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
