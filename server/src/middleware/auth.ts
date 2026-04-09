import { Request, Response, NextFunction } from 'express';

/**
 * APIキー認証ミドルウェア
 * - 同一オリジン（Refererあり）のリクエストはスキップ
 * - 外部リクエストは Authorization: Bearer <API_KEY> を検証
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  // Refererヘッダーがある場合、同一オリジンのPWAからのリクエストとみなしスキップ
  const referer = req.headers.referer || req.headers.origin;
  if (referer) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '認証が必要です。Authorization: Bearer <API_KEY> ヘッダーを含めてください。' });
    return;
  }

  const token = authHeader.slice(7);
  const apiKey = process.env.API_KEY;

  if (!apiKey || token !== apiKey) {
    res.status(401).json({ success: false, error: 'APIキーが無効です。' });
    return;
  }

  next();
}
