import { useState, useRef } from 'react';
import type { Settings } from '@shared/types';
import { api } from '../api/client';
import { loadSettings, saveSettings } from '../utils/storage';
import './SettingsPage.css';

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [resetStep, setResetStep] = useState(0);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateSetting = (key: keyof Settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // エクスポート
  const handleExport = async () => {
    try {
      const routines = await api.getRoutines();
      const data = JSON.stringify({ routines, exportedAt: new Date().toISOString() }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeboxing_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('エクスポートに失敗しました: ' + err.message);
    }
  };

  // インポート
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
      'インポートすると既存のデータが上書きされます。続行しますか？'
    );
    if (!confirmed) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.routines || !Array.isArray(data.routines)) {
        throw new Error('不正なバックアップファイルです。');
      }

      // 既存データを全削除してからインポート
      const existing = await api.getRoutines();
      for (const routine of existing) {
        await api.deleteRoutine(routine.id);
      }

      // 新しいデータを作成
      for (const routine of data.routines) {
        await api.createRoutine({
          name: routine.name,
          theme: routine.theme,
          tasks: routine.tasks.map((t: any) => ({
            name: t.name,
            minutes: t.minutes,
            seconds: t.seconds,
            order: t.order,
          })),
        });
      }

      alert('インポートが完了しました！');
    } catch (err: any) {
      alert('インポートに失敗しました: ' + err.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // データ初期化（2段階確認）
  const handleReset = async () => {
    if (resetStep === 0) {
      setResetStep(1);
      return;
    }
    if (resetStep === 1) {
      setResetStep(2);
      return;
    }

    try {
      const routines = await api.getRoutines();
      for (const routine of routines) {
        await api.deleteRoutine(routine.id);
      }
      saveSettings({ soundEnabled: true, vibrationEnabled: true });
      setSettings({ soundEnabled: true, vibrationEnabled: true });
      setResetStep(0);
      alert('初期化が完了しました。');
    } catch (err: any) {
      alert('初期化に失敗しました: ' + err.message);
    }
  };

  return (
    <div className="page settings-page" data-theme="light">
      <header className="page-header">
        <button className="btn-icon" onClick={onBack} aria-label="戻る" id="settings-back-btn">
          ←
        </button>
        <h1 className="page-title">設定</h1>
        <div style={{ width: 48 }} />
      </header>

      {/* 通知設定 */}
      <section className="settings-section">
        <h2 className="settings-section-title">🔔 通知設定</h2>

        <div className="toggle-container">
          <span className="toggle-label">通知音</span>
          <label className="toggle" id="sound-toggle">
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="toggle-container">
          <span className="toggle-label">バイブレーション</span>
          <label className="toggle" id="vibration-toggle">
            <input
              type="checkbox"
              checked={settings.vibrationEnabled}
              onChange={(e) => updateSetting('vibrationEnabled', e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </section>

      {/* データバックアップ */}
      <section className="settings-section">
        <h2 className="settings-section-title">💾 データバックアップ</h2>

        <button className="btn btn-secondary settings-btn" onClick={handleExport} id="export-btn">
          📤 エクスポート（JSONダウンロード）
        </button>

        <button
          className="btn btn-secondary settings-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          id="import-btn"
        >
          {importing ? '⏳ インポート中...' : '📥 インポート（JSONアップロード）'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
      </section>

      {/* データ初期化 */}
      <section className="settings-section">
        <h2 className="settings-section-title">⚠️ データ初期化</h2>

        {resetStep === 0 && (
          <button className="btn btn-danger settings-btn" onClick={handleReset} id="reset-btn">
            🗑️ 全データを初期化
          </button>
        )}

        {resetStep === 1 && (
          <div className="reset-confirm card">
            <p className="reset-warning">⚠️ 本当に初期化しますか？<br />全てのデータが削除されます。</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setResetStep(0)}>キャンセル</button>
              <button className="btn btn-danger" onClick={handleReset}>続行</button>
            </div>
          </div>
        )}

        {resetStep === 2 && (
          <div className="reset-confirm card">
            <p className="reset-warning reset-final">🚨 この操作は取り消せません。<br />本当に実行しますか？</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setResetStep(0)}>キャンセル</button>
              <button className="btn btn-danger" onClick={handleReset}>初期化を実行</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
