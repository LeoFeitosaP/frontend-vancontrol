import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hasTransportAPI, localDay, transportService, type Attendance, type TransportSnapshot } from '../services/transport';

export function useTransport(userId: string, trip: string | null) {
  const [now, setNow] = useState(Date.now());
  const date = localDay(new Date(now));
  const key = `@vancontrol:attendance:${encodeURIComponent(userId)}:${trip}:${date}`;
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [snapshot, setSnapshot] = useState<TransportSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);
  const scope = useRef(key); scope.current = key;
  const busy = useRef(false);
  const mutation = useRef(0);

  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    let alive = true;
    let controller: AbortController | null = null;
    let pending = false;
    setAttendance(null); setSnapshot(null); setError(null); setSaveError(null); setSyncedAt(null);
    setLoading(Boolean(trip));
    if (!trip) return;
    async function load() {
      if (pending || AppState.currentState === 'background') return;
      pending = true;
      const startedAtMutation = mutation.current;
      controller = new AbortController();
      try {
        if (hasTransportAPI) {
          const data = await transportService.snapshot(trip!, date, controller.signal);
          if (alive) {
            setSnapshot(data);
            if (!busy.current && startedAtMutation === mutation.current) setAttendance(data.presenca);
            setSyncedAt(Date.now()); setError(null);
          }
        } else {
          const stored = await AsyncStorage.getItem(key);
          if (alive) setAttendance(stored === 'VOU' || stored === 'NAO_VOU' ? stored : null);
        }
      } catch {
        if (alive) setError(hasTransportAPI ? 'Sem conexão com o acompanhamento. Os últimos dados podem estar desatualizados.' : 'Não foi possível ler sua preferência neste dispositivo.');
      } finally { pending = false; if (alive) setLoading(false); }
    }
    void load();
    const timer = hasTransportAPI ? setInterval(load, 15000) : undefined;
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void load(); });
    return () => { alive = false; controller?.abort(); clearInterval(timer); listener.remove(); };
  }, [trip, date, key, revision]);

  const choose = useCallback(async (value: Attendance) => {
    if (!trip || busy.current || loading) return;
    const previous = attendance;
    const requestScope = key;
    busy.current = true; mutation.current += 1; setSaving(true); setSaveError(null); setAttendance(value);
    try {
      if (hasTransportAPI) await transportService.attendance(trip, date, value);
      else await AsyncStorage.setItem(key, value);
    } catch {
      if (scope.current === requestScope) {
        setAttendance(previous);
        setSaveError('Não foi possível salvar. Tente novamente.');
      }
    } finally { busy.current = false; setSaving(false); }
  }, [trip, loading, attendance, key, date]);
  return { attendance, snapshot, loading, saving, error, saveError, syncedAt, now, choose, refresh: () => setRevision(v => v + 1), remote: hasTransportAPI };
}
