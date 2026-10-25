import { API_URL, http } from './client';

export type LiveMessage = { type: 'checkin' | 'checkout' | 'flag' | 'leave'; siteId?: string; employeeId?: string; recordId?: string };

const WS_URL = API_URL.replace(/^http/, 'ws');
const KEEPALIVE_MS = 25_000;
const MAX_BACKOFF_MS = 30_000;

type Listener = { onMessage: (m: LiveMessage) => void; onState: (up: boolean) => void };

const listeners = new Set<Listener>();
let socket: WebSocket | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let keepalive: ReturnType<typeof setInterval> | undefined;
let attempt = 0;
let isUp = false;

function setUp(up: boolean) {
  isUp = up;
  listeners.forEach((l) => l.onState(up));
}

function retry() {
  setUp(false);
  if (listeners.size === 0) return;
  timer = setTimeout(open, Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt++));
}

async function open() {
  if (listeners.size === 0) return;
  try {
    const { ticket } = await http.post<{ ticket: string }>('/ws/ticket');
    if (listeners.size === 0) return;
    const ws = new WebSocket(`${WS_URL}/ws?ticket=${encodeURIComponent(ticket)}`);
    socket = ws;
    ws.onopen = () => {
      attempt = 0;
      setUp(true);
      keepalive = setInterval(() => ws.readyState === WebSocket.OPEN && ws.send('ping'), KEEPALIVE_MS);
    };
    ws.onmessage = (e) => {
      try {
        const raw = JSON.parse(String(e.data)) as Record<string, string>;
        const m: LiveMessage = { type: raw.type as LiveMessage['type'], siteId: raw.site_id, employeeId: raw.employee_id, recordId: raw.record_id };
        listeners.forEach((l) => l.onMessage(m));
      } catch {
        // ignore frames that are not JSON
      }
    };
    ws.onclose = (e) => {
      clearInterval(keepalive);
      socket = null;
      if (e.code === 4403) return setUp(false); // no sites in scope: nothing to listen to
      retry();
    };
  } catch {
    retry();
  }
}

function close() {
  clearTimeout(timer);
  clearInterval(keepalive);
  const s = socket;
  socket = null;
  attempt = 0;
  isUp = false;
  s?.close();
}

/**
 * Listen to live attendance pushes. Screens share one socket: it opens with the first listener and closes with the
 * last. `onState` is called with the current state straight away and on every change.
 */
export function subscribeLive(listener: Listener): () => void {
  listeners.add(listener);
  listener.onState(isUp);
  if (listeners.size === 1) void open();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) close();
  };
}
