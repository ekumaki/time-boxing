import { Router, Request, Response } from 'express';
import { getDb } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';
import type { Routine, Task } from '../../../shared/types.js';

const router = Router();

// ===== ヘルパー関数 =====

function getRoutineWithTasks(routineId: string): Routine | null {
  const db = getDb();
  const routine = db.prepare('SELECT * FROM routines WHERE id = ?').get(routineId) as any;
  if (!routine) return null;

  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE routine_id = ? ORDER BY display_order ASC'
  ).all(routineId) as any[];

  return {
    id: routine.id,
    name: routine.name,
    theme: routine.theme,
    tasks: tasks.map((t) => ({
      id: t.id,
      name: t.name,
      minutes: t.minutes,
      seconds: t.seconds,
      order: t.display_order,
    })),
    createdAt: routine.created_at,
    updatedAt: routine.updated_at,
  };
}

function getAllRoutinesWithTasks(): Routine[] {
  const db = getDb();
  const routines = db.prepare(
    'SELECT * FROM routines ORDER BY display_order ASC'
  ).all() as any[];

  return routines.map((r) => {
    const tasks = db.prepare(
      'SELECT * FROM tasks WHERE routine_id = ? ORDER BY display_order ASC'
    ).all(r.id) as any[];

    return {
      id: r.id,
      name: r.name,
      theme: r.theme,
      tasks: tasks.map((t) => ({
        id: t.id,
        name: t.name,
        minutes: t.minutes,
        seconds: t.seconds,
        order: t.display_order,
      })),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });
}

// ===== GET /api/routines =====
router.get('/', (_req: Request, res: Response) => {
  try {
    const routines = getAllRoutinesWithTasks();
    res.json({ success: true, data: routines });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'ルーチン一覧の取得に失敗しました。' });
  }
});

// ===== GET /api/routines/:id =====
router.get('/:id', (req: Request, res: Response) => {
  try {
    const routine = getRoutineWithTasks(req.params.id);
    if (!routine) {
      res.status(404).json({ success: false, error: 'ルーチンが見つかりません。' });
      return;
    }
    res.json({ success: true, data: routine });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'ルーチンの取得に失敗しました。' });
  }
});

// ===== POST /api/routines =====
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, theme, tasks } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({ success: false, error: 'ルーチン名は必須です。' });
      return;
    }

    const db = getDb();
    const routineId = uuidv4();
    const now = new Date().toISOString();

    // 最大のdisplay_orderを取得
    const maxOrder = db.prepare(
      'SELECT COALESCE(MAX(display_order), -1) as max_order FROM routines'
    ).get() as any;

    const insertRoutine = db.prepare(`
      INSERT INTO routines (id, name, theme, display_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertTask = db.prepare(`
      INSERT INTO tasks (id, routine_id, name, minutes, seconds, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      insertRoutine.run(routineId, name, theme || 'light', maxOrder.max_order + 1, now, now);

      if (tasks && Array.isArray(tasks)) {
        tasks.forEach((task: any, index: number) => {
          insertTask.run(
            uuidv4(),
            routineId,
            task.name || '',
            task.minutes || 0,
            task.seconds || 0,
            index
          );
        });
      }
    });

    transaction();

    const created = getRoutineWithTasks(routineId);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'ルーチンの作成に失敗しました。' });
  }
});

// ===== PUT /api/routines/:id =====
router.put('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM routines WHERE id = ?').get(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'ルーチンが見つかりません。' });
      return;
    }

    const { name, theme, tasks } = req.body;
    const now = new Date().toISOString();

    const transaction = db.transaction(() => {
      // ルーチン更新
      if (name !== undefined || theme !== undefined) {
        const updates: string[] = [];
        const values: any[] = [];

        if (name !== undefined) {
          updates.push('name = ?');
          values.push(name);
        }
        if (theme !== undefined) {
          updates.push('theme = ?');
          values.push(theme);
        }
        updates.push('updated_at = ?');
        values.push(now);
        values.push(req.params.id);

        db.prepare(`UPDATE routines SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      }

      // タスクの更新（全置換）
      if (tasks !== undefined && Array.isArray(tasks)) {
        db.prepare('DELETE FROM tasks WHERE routine_id = ?').run(req.params.id);

        const insertTask = db.prepare(`
          INSERT INTO tasks (id, routine_id, name, minutes, seconds, display_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        tasks.forEach((task: any, index: number) => {
          insertTask.run(
            uuidv4(),
            req.params.id,
            task.name || '',
            task.minutes || 0,
            task.seconds || 0,
            index
          );
        });

        // タスク変更時もupdated_atを更新
        db.prepare('UPDATE routines SET updated_at = ? WHERE id = ?').run(now, req.params.id);
      }
    });

    transaction();

    const updated = getRoutineWithTasks(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'ルーチンの更新に失敗しました。' });
  }
});

// ===== DELETE /api/routines/:id =====
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM routines WHERE id = ?').get(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'ルーチンが見つかりません。' });
      return;
    }

    db.prepare('DELETE FROM routines WHERE id = ?').run(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'ルーチンの削除に失敗しました。' });
  }
});

// ===== PUT /api/routines/reorder =====
router.put('/reorder', (req: Request, res: Response) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, error: 'orderedIds配列が必要です。' });
      return;
    }

    const db = getDb();
    const updateOrder = db.prepare('UPDATE routines SET display_order = ? WHERE id = ?');

    const transaction = db.transaction(() => {
      orderedIds.forEach((id: string, index: number) => {
        updateOrder.run(index, id);
      });
    });

    transaction();

    const routines = getAllRoutinesWithTasks();
    res.json({ success: true, data: routines });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: '並べ替えに失敗しました。' });
  }
});

export default router;
