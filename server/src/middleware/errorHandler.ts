import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('サーバーエラー:', err.message);
  res.status(500).json({
    success: false,
    error: 'サーバー内部エラーが発生しました。',
  });
}
