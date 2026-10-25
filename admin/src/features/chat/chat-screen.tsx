"use client";

import { ArrowLeft, FileText, Hash, MessageSquarePlus, Paperclip, Search, Send, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  loadOlder, loadPeople, openConversation, openDirect, sendMessage, uploadAttachment, useChat,
  type ChatAttachment, type ChatMessage, type ChatPerson, type Conversation,
} from "@/services/chat";
import { useAuth } from "@/store/auth";

const MAX_FILES = 6;

/** In-app chat: direct conversations with colleagues and one group per site. */
export function ChatScreen() {
  const t = useTranslations("Chat");
  const conversations = useChat((s) => s.conversations);
  const activeId = useChat((s) => s.activeId);
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState(false);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? conversations.filter((c) => c.title.toLowerCase().includes(q)) : conversations;
  }, [conversations, query]);

  const open = (id: string) => {
    openConversation(id).catch(() => toast(t("loadFailed"), "bad"));
  };

  return (
    <div className="flex h-[calc(100vh-130px)] min-h-[460px] overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <aside className={cn("flex w-full flex-col border-r border-border md:w-[320px] md:flex-none", active && "hidden md:flex")}>
        <div className="flex items-center gap-2 border-b border-border px-3.5 py-3">
          <h1 className="m-0 flex-1 text-[16px] font-semibold">{t("title")}</h1>
          <button onClick={() => setPicking((v) => !v)} aria-label={t("newChat")} title={t("newChat")} className="grid size-8 place-items-center rounded-lg border-0 bg-transparent text-text-2 hover:bg-hover">
            <MessageSquarePlus size={18} />
          </button>
        </div>
        {picking ? (
          <PeoplePicker
            onClose={() => setPicking(false)}
            onPick={(p) => {
              setPicking(false);
              openDirect(p.id).then(open, () => toast(t("loadFailed"), "bad"));
            }}
          />
        ) : (
          <>
            <label className="relative m-2.5 block">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="h-9 w-full rounded-[9px] border border-solid border-border-strong bg-surface pl-8 pr-2.5 text-[13px] text-text outline-none focus:border-accent" />
            </label>
            <ul className="m-0 flex-1 list-none overflow-y-auto p-0">
              {shown.map((c) => <ConversationRow key={c.id} c={c} active={c.id === activeId} onOpen={() => open(c.id)} />)}
              {shown.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-text-3">{t("noConversations")}</li>}
            </ul>
          </>
        )}
      </aside>
      <section className={cn("min-w-0 flex-1 flex-col", active ? "flex" : "hidden md:flex")}>
        {active ? <Thread key={active.id} c={active} /> : <div className="grid flex-1 place-items-center px-6 text-center text-[13.5px] text-text-3">{t("pickOne")}</div>}
      </section>
    </div>
  );
}

function ConversationRow({ c, active, onOpen }: { c: Conversation; active: boolean; onOpen: () => void }) {
  const t = useTranslations("Chat");
  const format = useFormatter();
  const when = c.last_message_at ? format.dateTime(new Date(c.last_message_at), sameDay(c.last_message_at) ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" }) : "";
  return (
    <li>
      <button onClick={onOpen} className={cn("flex w-full items-center gap-3 border-0 border-b border-solid border-border bg-transparent px-3.5 py-3 text-left hover:bg-hover", active && "bg-hover")}>
        {c.kind === "site" ? <span className="grid size-9 flex-none place-items-center rounded-full bg-accent-bg text-accent"><Hash size={17} /></span> : <Avatar name={c.title} size={36} />}
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-[13.5px] font-semibold text-text">{c.title}</span>
            <span className="ml-auto flex-none text-[11.5px] text-text-3">{when}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-text-3">{c.last_message_preview ?? (c.kind === "site" ? t("siteGroup", { count: c.members ?? 0 }) : "")}</span>
            {c.unread > 0 && <span className="grid h-[18px] min-w-[18px] flex-none place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">{c.unread > 99 ? "99+" : c.unread}</span>}
          </span>
        </span>
      </button>
    </li>
  );
}

const sameDay = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

function PeoplePicker({ onPick, onClose }: { onPick: (p: ChatPerson) => void; onClose: () => void }) {
  const t = useTranslations("Chat");
  const [q, setQ] = useState("");
  const [people, setPeople] = useState<ChatPerson[]>([]);
  useEffect(() => {
    let live = true;
    const id = setTimeout(() => void loadPeople(q).then((p) => live && setPeople(p), () => undefined), 200);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [q]);
  return (
    <>
      <div className="flex items-center gap-2 px-3 pb-1 pt-2.5">
        <button onClick={onClose} aria-label={t("back")} className="grid size-8 place-items-center rounded-lg border-0 bg-transparent text-text-2 hover:bg-hover"><ArrowLeft size={17} /></button>
        <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus placeholder={t("searchPeople")} aria-label={t("searchPeople")} className="h-9 min-w-0 flex-1 rounded-[9px] border border-solid border-border-strong bg-surface px-2.5 text-[13px] text-text outline-none focus:border-accent" />
      </div>
      <ul className="m-0 flex-1 list-none overflow-y-auto p-0">
        {people.map((p) => (
          <li key={p.id}>
            <button onClick={() => onPick(p)} className="flex w-full items-center gap-3 border-0 bg-transparent px-3.5 py-2.5 text-left hover:bg-hover">
              <Avatar name={p.name} size={32} />
              <span className="min-w-0"><span className="block truncate text-[13.5px] font-medium text-text">{p.name}</span>{p.title && <span className="block truncate text-[12px] text-text-3">{p.title}</span>}</span>
            </button>
          </li>
        ))}
        {people.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-text-3">{t("noPeople")}</li>}
      </ul>
    </>
  );
}

function Thread({ c }: { c: Conversation }) {
  const t = useTranslations("Chat");
  const toast = useToast();
  const me = useAuth((s) => s.me);
  const messages = useChat((s) => s.messages[c.id]);
  const complete = useChat((s) => s.complete[c.id]);
  const online = useChat((s) => s.online);
  const bottom = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  // Stay at the newest message when one arrives, unless the reader scrolled up to older ones.
  const last = messages?.[messages.length - 1]?.id;
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    if (nearBottom || messages?.length === 1 || !el.dataset.placed) {
      bottom.current?.scrollIntoView({ block: "end" });
      el.dataset.placed = "1";
    }
  }, [last, messages?.length]);

  const submit = async () => {
    const body = text.trim();
    if ((!body && files.length === 0) || sending) return;
    setSending(true);
    try {
      const uploaded = await Promise.all(files.map(uploadAttachment));
      await sendMessage(c.id, body, uploaded);
      setText("");
      setFiles([]);
    } catch {
      toast(t("sendFailed"), "bad");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={() => useChat.setState({ activeId: null })} aria-label={t("back")} className="grid size-8 place-items-center rounded-lg border-0 bg-transparent text-text-2 hover:bg-hover md:hidden"><ArrowLeft size={17} /></button>
        {c.kind === "site" ? <span className="grid size-9 flex-none place-items-center rounded-full bg-accent-bg text-accent"><Hash size={17} /></span> : <Avatar name={c.title} size={36} />}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14.5px] font-semibold">{c.title}</div>
          <div className="truncate text-[12px] text-text-3">{c.kind === "site" ? t("siteGroup", { count: c.members ?? 0 }) : c.other?.title ?? t("direct")}{!online && ` · ${t("offline")}`}</div>
        </div>
      </header>
      <div ref={list} className="flex-1 overflow-y-auto bg-bg px-4 py-3">
        {!complete && messages && messages.length > 0 && <button onClick={() => void loadOlder(c.id)} className="mx-auto mb-3 block rounded-full border border-solid border-border-strong bg-surface px-3 py-1 text-[12px] text-text-2">{t("older")}</button>}
        {messages?.map((m, i) => <Bubble key={m.id} m={m} mine={m.sender.id === me?.id} previous={messages[i - 1]} showSender={c.kind === "site"} />)}
        {messages && messages.length === 0 && <div className="py-10 text-center text-[13px] text-text-3">{t("emptyThread")}</div>}
        <div ref={bottom} />
      </div>
      <footer className="border-t border-border bg-surface p-3">
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {files.map((f, i) => (
              <span key={`${f.name}-${i}`} className="flex max-w-[220px] items-center gap-1.5 rounded-full bg-hover px-2.5 py-1 text-[12px] text-text-2">
                <FileText size={12} /><span className="truncate">{f.name}</span>
                <button onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} aria-label={t("removeFile")} className="grid size-4 place-items-center border-0 bg-transparent p-0 text-text-3"><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileInput} type="file" multiple hidden accept="image/*,video/mp4,video/quicktime,audio/*,application/pdf" onChange={(e) => { setFiles((x) => [...x, ...Array.from(e.target.files ?? [])].slice(0, MAX_FILES)); e.target.value = ""; }} />
          <button onClick={() => fileInput.current?.click()} aria-label={t("attach")} title={t("attach")} className="grid size-9 flex-none place-items-center rounded-lg border-0 bg-transparent text-text-2 hover:bg-hover"><Paperclip size={18} /></button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(); } }}
            rows={1}
            maxLength={4000}
            placeholder={t("write")}
            aria-label={t("write")}
            className="max-h-32 min-h-9 flex-1 resize-none rounded-[10px] border border-solid border-border-strong bg-surface px-3 py-2 text-[13.5px] text-text outline-none focus:border-accent"
          />
          <button onClick={() => void submit()} disabled={sending || (!text.trim() && files.length === 0)} aria-label={t("send")} title={t("send")} className="grid size-9 flex-none place-items-center rounded-lg border-0 bg-accent text-white disabled:opacity-45"><Send size={16} /></button>
        </div>
      </footer>
    </>
  );
}

function Bubble({ m, mine, previous, showSender }: { m: ChatMessage; mine: boolean; previous?: ChatMessage; showSender: boolean }) {
  const format = useFormatter();
  const grouped = previous?.sender.id === m.sender.id && Date.parse(m.created_at) - Date.parse(previous.created_at) < 5 * 60_000;
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start", grouped ? "mt-0.5" : "mt-3")}>
      <div className={cn("max-w-[78%] rounded-2xl px-3 py-2 text-[13.5px] leading-[1.4]", mine ? "rounded-br-md bg-accent text-white" : "rounded-bl-md border border-border bg-surface text-text")}>
        {!mine && showSender && !grouped && <div className="mb-0.5 text-[12px] font-semibold text-accent">{m.sender.name}</div>}
        {m.attachments.map((a) => <Media key={a.key} a={a} mine={mine} />)}
        {m.body && <div className="whitespace-pre-wrap break-words">{m.body}</div>}
        <div className={cn("mt-0.5 text-right text-[10.5px]", mine ? "text-white/75" : "text-text-3")}>{format.dateTime(new Date(m.created_at), { hour: "2-digit", minute: "2-digit" })}</div>
      </div>
    </div>
  );
}

function Media({ a, mine }: { a: ChatAttachment; mine: boolean }) {
  if (a.content_type.startsWith("image/")) {
    return (
      <a href={a.url} target="_blank" rel="noreferrer" className="mb-1 block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.url} alt={a.name} loading="lazy" className="max-h-64 max-w-full rounded-lg object-cover" />
      </a>
    );
  }
  if (a.content_type.startsWith("video/")) return <video src={a.url} controls preload="metadata" className="mb-1 max-h-64 max-w-full rounded-lg" />;
  if (a.content_type.startsWith("audio/")) return <audio src={a.url} controls preload="none" className="mb-1 w-full max-w-[260px]" />;
  return (
    <a href={a.url} target="_blank" rel="noreferrer" className={cn("mb-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] no-underline", mine ? "bg-white/15 text-white" : "bg-hover text-text")}>
      <FileText size={15} /><span className="truncate">{a.name}</span>
    </a>
  );
}
