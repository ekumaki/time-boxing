import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import routinesRouter from './routes/routines.js';
import { apiKeyAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { closeDb } from './db/database.js';

// .env読み込み
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(express.json());

// API ルート（認証ミドルウェア付き）
app.use('/api/routines', apiKeyAuth, routinesRouter);

// ヘルスチェック
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 本番環境ではビルド済みクライアントを配信
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDistPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// エラーハンドリング
app.use(errorHandler);

// サーバー起動
const server = app.listen(PORT, () => {
  console.log(`🕐 タイムボクシングサーバー起動: http://localhost:${PORT}`);
});

// グレースフルシャットダウン
process.on('SIGINT', () => {
  console.log('\nサーバーを停止します...');
  closeDb();
  server.close();
  process.exit(0);
});
