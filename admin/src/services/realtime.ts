import { api } from "@/lib/api";

export interface LiveMessage {
  type: "checkin" | "checkout" | "flag" | "leave";
  site_id?: string;
  employee_id?: string;
  record_id?: string;
}

const wsBase = (): string => (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace(/^http/, "ws");
const KEEPALIVE_MS = 25_000;
const MAX_BACKOFF_MS = 30_000;

/**
 * Subscribe to live attendance pushes for the sites the user may see. Each (re)connect first asks for a
 * single-use ticket; drops reconnect with backoff. `onState` reports whether the socket is up, so callers
 * can poll while it is not. Returns a function that closes everything.
 */
export function connectLive(onMessage: (m: LiveMessage) => void, onState: (up: boolean) => void): () => void {
  return connectSocket<LiveMessage>("/ws/ticket", onMessage, onState);
}

/** Same socket, other ticket: `/chat/ticket` subscribes it to the user's chat channels. */
export function connectSocket<T>(ticketPath: string, onMessage: (m: T) => void, onState: (up: boolean) => void): () => void {
  let socket: WebSocket | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let keepalive: ReturnType<typeof setInterval> | undefined;
  let attempt = 0;
  let stopped = false;

  const retry = () => {
    onState(false);
    if (stopped) return;
    timer = setTimeout(open, Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt++));
  };

  async function open() {
    try {
      const { ticket } = await api.post<{ ticket: string }>(ticketPath);
      if (stopped) return;
      const ws = new WebSocket(`${wsBase()}/ws?ticket=${encodeURIComponent(ticket)}`);
      socket = ws;
      ws.onopen = () => {
        attempt = 0;
        onState(true);
        keepalive = setInterval(() => ws.readyState === WebSocket.OPEN && ws.send("ping"), KEEPALIVE_MS);
      };
      ws.onmessage = (e) => {
        try {
          onMessage(JSON.parse(String(e.data)) as T);
        } catch {
          // ignore frames that are not JSON
        }
      };
      ws.onclose = (e) => {
        clearInterval(keepalive);
        // 4403: no sites in scope, nothing to listen to; do not hammer the server.
        if (e.code === 4403) return onState(false);
        retry();
      };
    } catch {
      retry();
    }
  }

  void open();
  return () => {
    stopped = true;
    clearTimeout(timer);
    clearInterval(keepalive);
    socket?.close();
  };
}
