import type { Routine, ApiResponse, RoutineCreateRequest, RoutineUpdateRequest } from '@shared/types';

const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data: ApiResponse<T> = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data.data as T;
}

export const api = {
  getRoutines: () => request<Routine[]>('/routines'),

  getRoutine: (id: string) => request<Routine>(`/routines/${id}`),

  createRoutine: (data: RoutineCreateRequest) =>
    request<Routine>('/routines', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRoutine: (id: string, data: RoutineUpdateRequest) =>
    request<Routine>(`/routines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteRoutine: (id: string) =>
    request<null>(`/routines/${id}`, {
      method: 'DELETE',
    }),

  reorderRoutines: (orderedIds: string[]) =>
    request<Routine[]>('/routines/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    }),
};
