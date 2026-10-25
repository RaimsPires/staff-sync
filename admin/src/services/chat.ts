import { create } from "zustand";
import { api } from "@/lib/api";
import { connectSocket } from "@/services/realtime";

export interface ChatPerson {
  id: string;
  name: string;
  title: string | null;
  avatar_url: string | null;
}
export interface ChatAttachment {
  key: string;
  name: string;
  content_type: string;
  size: number;
  url: string;
}
export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: ChatPerson;
  body: string;
  attachments: ChatAttachment[];
  created_at: string;
}
export interface Conversation {
  id: string;
  kind: "direct" | "site";
  title: string;
  site_id: string | null;
  other: ChatPerson | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread: number;
  can_write: boolean;
  members: number | null;
}

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  activeId: string | null;
  /** Conversations whose older history is exhausted. */
  complete: Record<string, boolean>;
  online: boolean;
}

export const useChat = create<ChatState>(() => ({ conversations: [], messages: {}, activeId: null, complete: {}, online: false }));

export const totalUnread = (conversations: Conversation[]): number => conversations.reduce((n, c) => n + c.unread, 0);

const PAGE = 40;

export async function loadConversations(): Promise<void> {
  const conversations = await api.get<Conversation[]>("/chat/conversations");
  useChat.setState({ conversations });
}

export async function loadPeople(q: string): Promise<ChatPerson[]> {
  return api.get<ChatPerson[]>("/chat/people", { params: { q: q || undefined } });
}

export async function openDirect(userId: string): Promise<string> {
  const conv = await api.post<Conversation>("/chat/conversations/direct", { user_id: userId });
  useChat.setState((s) => (s.conversations.some((c) => c.id === conv.id) ? s : { conversations: [conv, ...s.conversations] }));
  return conv.id;
}

/** Make a conversation the open one: load its latest messages and mark it read. */
export async function openConversation(id: string): Promise<void> {
  useChat.setState({ activeId: id });
  const latest = await api.get<ChatMessage[]>(`/chat/conversations/${id}/messages`, { params: { limit: PAGE } });
  useChat.setState((s) => ({ messages: { ...s.messages, [id]: latest }, complete: { ...s.complete, [id]: latest.length < PAGE } }));
  await markRead(id);
}

export async function loadOlder(id: string): Promise<void> {
  const current = useChat.getState().messages[id] ?? [];
  if (!current.length || useChat.getState().complete[id]) return;
  const older = await api.get<ChatMessage[]>(`/chat/conversations/${id}/messages`, { params: { limit: PAGE, before: current[0].created_at } });
  useChat.setState((s) => ({ messages: { ...s.messages, [id]: [...older, ...(s.messages[id] ?? [])] }, complete: { ...s.complete, [id]: older.length < PAGE } }));
}

export async function markRead(id: string): Promise<void> {
  useChat.setState((s) => ({ conversations: s.conversations.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) }));
  await api.post(`/chat/conversations/${id}/read`).catch(() => undefined);
}

/** Upload one file straight to storage through a presigned address, then describe it for the message. */
export async function uploadAttachment(file: File): Promise<Omit<ChatAttachment, "url">> {
  const contentType = file.type || "application/octet-stream";
  const target = await api.post<{ key: string; url: string; method: "PUT" | "POST"; headers?: Record<string, string>; fields?: Record<string, string> }>("/uploads/chat-attachment", {
    content_type: contentType,
    size_bytes: file.size,
  });
  if (target.method === "PUT") {
    const res = await fetch(target.url, { method: "PUT", headers: target.headers, body: file });
    if (!res.ok) throw new Error(`upload failed (${res.status})`);
  } else {
    const form = new FormData();
    Object.entries(target.fields ?? {}).forEach(([k, v]) => form.append(k, v));
    form.append("file", file);
    const res = await fetch(target.url, { method: "POST", body: form });
    if (!res.ok) throw new Error(`upload failed (${res.status})`);
  }
  return { key: target.key, name: file.name, content_type: contentType, size: file.size };
}

export async function sendMessage(id: string, body: string, attachments: Omit<ChatAttachment, "url">[] = []): Promise<void> {
  const msg = await api.post<ChatMessage>(`/chat/conversations/${id}/messages`, { body, attachments });
  receive(msg, false);
}

interface Incoming {
  type: "chat.message";
  conversation_id: string;
  message: ChatMessage;
}

/** Add a message to its conversation (from the socket or from our own send); the open conversation counts it as read. */
export function receive(message: ChatMessage, fromOthers = true): void {
  const state = useChat.getState();
  const id = message.conversation_id;
  const known = state.conversations.some((c) => c.id === id);
  const open = state.activeId === id && typeof document !== "undefined" && document.visibilityState === "visible";
  const existing = state.messages[id];
  if (existing?.some((m) => m.id === message.id)) return;
  useChat.setState((s) => ({
    messages: existing ? { ...s.messages, [id]: [...existing, message] } : s.messages,
    conversations: s.conversations
      .map((c) => (c.id === id ? { ...c, last_message_at: message.created_at, last_message_preview: message.body || "📎", unread: fromOthers && !open ? c.unread + 1 : c.unread } : c))
      .sort((a, b) => (b.last_message_at ?? "").localeCompare(a.last_message_at ?? "")),
  }));
  if (!known) void loadConversations().catch(() => undefined); // a conversation we had not seen yet (new direct chat)
  if (fromOthers && open) void markRead(id);
}

/** Keep chat live while signed in: socket pushes, with a refresh of the list whenever the socket comes back. */
export function startChat(): () => void {
  void loadConversations().catch(() => undefined);
  return connectSocket<Incoming>(
    "/chat/ticket",
    (m) => {
      if (m.type === "chat.message") receive(m.message);
    },
    (up) => {
      const wasDown = !useChat.getState().online;
      useChat.setState({ online: up });
      if (up && wasDown) {
        void loadConversations().catch(() => undefined); // catch up on anything missed while disconnected
        const open = useChat.getState().activeId;
        if (open) void openConversation(open).catch(() => undefined);
      }
    },
  );
}

export function resetChat(): void {
  useChat.setState({ conversations: [], messages: {}, activeId: null, complete: {}, online: false });
}
