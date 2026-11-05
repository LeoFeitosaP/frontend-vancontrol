import AsyncStorage from '@react-native-async-storage/async-storage';

// Optional integration: enable only after implementing the contract in ATUALIZACOES.md.
const transportURL = process.env.EXPO_PUBLIC_TRANSPORT_API_URL?.replace(/\/$/, '');
export const hasTransportAPI = Boolean(transportURL);
export type Attendance = 'VOU' | 'NAO_VOU';
export interface TransportSnapshot {
  presenca: Attendance | null;
  ocupacao: { embarcados: number; capacidade: number } | null;
  localizacao: { latitude: number; longitude: number; atualizadoEm: string } | null;
  paradas: { id: string; nome: string; horario?: string; estado: 'CONCLUIDA' | 'PROXIMA' | 'PENDENTE' }[];
}
export function localDay(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function isFreshLocation(location: TransportSnapshot['localizacao'], now = Date.now()) {
  if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)
      || Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180) return false;
  const age = now - Date.parse(location.atualizadoEm);
  return age >= -5000 && age <= 90000;
}
export function occupancyRatio(occupancy: TransportSnapshot['ocupacao']) {
  if (!occupancy || !Number.isInteger(occupancy.embarcados) || !Number.isInteger(occupancy.capacidade)
      || occupancy.capacidade <= 0 || occupancy.embarcados < 0) return null;
  return Math.min(1, occupancy.embarcados / occupancy.capacidade);
}
async function transportRequest<T>(path: string, method = 'GET', body?: object, signal?: AbortSignal): Promise<T> {
  const token = await AsyncStorage.getItem('@vancontrol:token');
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort);
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await fetch(`${transportURL}${path}`, {
      method, signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`Não foi possível sincronizar (${response.status}).`);
    return response.status === 204 ? undefined as T : await response.json();
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
export const transportService = {
  snapshot: (trip: string, date: string, signal: AbortSignal) => transportRequest<TransportSnapshot>(`/viagens/${encodeURIComponent(trip)}/acompanhamento?data=${date}`, 'GET', undefined, signal),
  attendance: (trip: string, date: string, presenca: Attendance) => transportRequest<void>(`/viagens/${encodeURIComponent(trip)}/presenca`, 'PUT', { data: date, presenca }),
};
