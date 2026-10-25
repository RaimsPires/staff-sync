import { create } from 'zustand';

import { API_URL, USE_MOCK, http } from './http/client';
import { uploadFile } from './http/upload';

export type ChatPerson = { id: string; name: string; title?: string; avatarUrl?: string };
export type ChatAttachment = { key: string; name: string; contentType: string; size: number; url: string };
export type ChatMessage = { id: string; conversationId: string; sender: ChatPerson; body: string; attachments: ChatAttachment[]; createdAt: string };
export type Conversation = {
  id: string;
  kind: 'direct' | 'site';
  title: string;
  siteId?: string;
  other?: ChatPerson;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unread: number;
  members?: number;
};
/** A file picked on the phone, before it is uploaded. */
export type Draft = { uri: string; name: string; contentType: string; size: number };

type State = {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  complete: Record<string, boolean>;
  activeId: string | null;
  online: boolean;
};

export const useChat = create<State>()(() => ({ conversations: [], messages: {}, complete: {}, activeId: null, online: false }));

export const totalUnread = (list: Conversation[]) => list.reduce((n, c) => n + c.unread, 0);

const PAGE = 40;

export async function loadConversations(): Promise<void> {
  if (USE_MOCK) return;
  useChat.setState({ conversations: await http.get<Conversation[]>('/chat/conversations') });
}

export const loadPeople = (q: string) => (USE_MOCK ? Promise.resolve([]) : http.get<ChatPerson[]>('/chat/people', { query: { q: q || undefined } }));

export async function openDirect(userId: string): Promise<string> {
  const conv = await http.post<Conversation>('/chat/conversations/direct', { body: { userId } });
  useChat.setState((s) => (s.conversations.some((c) => c.id === conv.id) ? s : { conversations: [conv, ...s.conversations] }));
  return conv.id;
}

export async function markRead(id: string): Promise<void> {
  useChat.setState((s) => ({ conversations: s.conversations.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) }));
  await http.post(`/chat/conversations/${id}/read`).catch(() => undefined);
}

/** Make a conversation the open one: load its newest messages and mark it read. */
export async function openConversation(id: string): Promise<void> {
  useChat.setState({ activeId: id });
  const latest = await http.get<ChatMessage[]>(`/chat/conversations/${id}/messages`, { query: { limit: PAGE } });
  useChat.setState((s) => ({ messages: { ...s.messages, [id]: latest }, complete: { ...s.complete, [id]: latest.length < PAGE } }));
  await markRead(id);
}

export function closeConversation(id: string): void {
  useChat.setState((s) => (s.activeId === id ? { activeId: null } : s));
}

export async function loadOlder(id: string): Promise<void> {
  const { messages, complete } = useChat.getState();
  const current = messages[id] ?? [];
  if (!current.length || complete[id]) return;
  const older = await http.get<ChatMessage[]>(`/chat/conversations/${id}/messages`, { query: { limit: PAGE, before: current[0].createdAt } });
  useChat.setState((s) => ({ messages: { ...s.messages, [id]: [...older, ...(s.messages[id] ?? [])] }, complete: { ...s.complete, [id]: older.length < PAGE } }));
}

export async function sendMessage(id: string, body: string, drafts: Draft[] = []): Promise<void> {
  const attachments = [];
  for (const d of drafts) {
    const key = await uploadFile('chat-attachment', d.uri, d.contentType);
    attachments.push({ key, name: d.name, contentType: d.contentType, size: d.size });
  }
  const msg = await http.post<ChatMessage>(`/chat/conversations/${id}/messages`, { body: { body, attachments } });
  receive(msg, false);
}

/** Add a message to its conversation, from the socket or from our own send. The open conversation counts it as read. */
export function receive(message: ChatMessage, fromOthers = true): void {
  const state = useChat.getState();
  const id = message.conversationId;
  const existing = state.messages[id];
  if (existing?.some((m) => m.id === message.id)) return;
  const open = state.activeId === id;
  const known = state.conversations.some((c) => c.id === id);
  useChat.setState((s) => ({
    messages: existing ? { ...s.messages, [id]: [...existing, message] } : s.messages,
    conversations: s.conversations
      .map((c) => (c.id === id ? { ...c, lastMessageAt: message.createdAt, lastMessagePreview: message.body || '📎', unread: fromOthers && !open ? c.unread + 1 : c.unread } : c))
      .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? '')),
  }));
  if (!known) void loadConversations().catch(() => undefined);
  if (fromOthers && open) void markRead(id);
}

// --- live connection ------------------------------------------------------------------------------------------

const WS_URL = API_URL.replace(/^http/, 'ws');
const KEEPALIVE_MS = 25_000;
const MAX_BACKOFF_MS = 30_000;

/**
 * Keep chat live while signed in. Pushes arrive over the WebSocket; every (re)connect first catches up on what was
 * missed. Returns a function that closes everything.
 */
export function startChat(): () => void {
  if (USE_MOCK) return () => undefined;
  let socket: WebSocket | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let keepalive: ReturnType<typeof setInterval> | undefined;
  let attempt = 0;
  let stopped = false;

  void loadConversations().catch(() => undefined);

  const retry = () => {
    useChat.setState({ online: false });
    if (stopped) return;
    timer = setTimeout(open, Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt++));
  };

  async function open() {
    try {
      const { ticket } = await http.post<{ ticket: string }>('/chat/ticket');
      if (stopped) return;
      const ws = new WebSocket(`${WS_URL}/ws?ticket=${encodeURIComponent(ticket)}`);
      socket = ws;
      ws.onopen = () => {
        attempt = 0;
        useChat.setState({ online: true });
        void loadConversations().catch(() => undefined);
        const active = useChat.getState().activeId;
        if (active) void openConversation(active).catch(() => undefined);
        keepalive = setInterval(() => ws.readyState === WebSocket.OPEN && ws.send('ping'), KEEPALIVE_MS);
      };
      ws.onmessage = (e) => {
        try {
          const raw = JSON.parse(String(e.data)) as { type?: string; message?: unknown };
          if (raw.type === 'chat.message' && raw.message) receive(toMessage(raw.message as Record<string, unknown>));
        } catch {
          // ignore frames that are not JSON
        }
      };
      ws.onclose = () => {
        clearInterval(keepalive);
        socket = null;
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
    useChat.setState({ conversations: [], messages: {}, complete: {}, activeId: null, online: false });
  };
}

// The socket carries the raw server JSON (snake_case); the HTTP client converts it for us, the socket does not.
type Raw = Record<string, any>;
const toPerson = (p: Raw): ChatPerson => ({ id: p.id, name: p.name ?? '', title: p.title ?? undefined, avatarUrl: p.avatar_url ?? undefined });
const toMessage = (m: Raw): ChatMessage => ({
  id: m.id,
  conversationId: m.conversation_id,
  sender: toPerson(m.sender ?? {}),
  body: m.body ?? '',
  attachments: (m.attachments ?? []).map((a: Raw) => ({ key: a.key, name: a.name, contentType: a.content_type, size: a.size, url: a.url })),
  createdAt: m.created_at,
});
