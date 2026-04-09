// ===== テーマ =====
export type ThemeType = 'light' | 'dark' | 'pop' | 'rock';

// ===== タスク =====
export interface Task {
  id: string;
  name: string;
  minutes: number;
  seconds: number;
  order: number;
}

// ===== ルーチン =====
export interface Routine {
  id: string;
  name: string;
  theme: ThemeType;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

// ===== ルーチン作成・更新リクエスト =====
export interface RoutineCreateRequest {
  name: string;
  theme: ThemeType;
  tasks: Omit<Task, 'id'>[];
}

export interface RoutineUpdateRequest {
  name?: string;
  theme?: ThemeType;
  tasks?: Omit<Task, 'id'>[];
}

// ===== 設定 =====
export interface Settings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  vibrationEnabled: true,
};

// ===== APIレスポンス =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
