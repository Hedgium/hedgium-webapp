"use client";

import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import { useWhatsAppStore } from "@/store/whatsappStore";
import { MessageCircle, Search, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Conversation = {
  id: number;
  wa_id: string;
  display_name: string;
  unread_count: number;
  user_id: number | null;
  user_name: string | null;
  lead_id: number | null;
  lead_name: string | null;
  last_message_preview: string;
  last_message_at: string | null;
  can_reply_freeform: boolean;
  last_inbound_at: string | null;
};

function sortConversationsByRecent(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    const aTime = a.last_message_at
      ? new Date(a.last_message_at).getTime()
      : 0;
    const bTime = b.last_message_at
      ? new Date(b.last_message_at).getTime()
      : 0;
    return bTime - aTime;
  });
}

type Message = {
  id: number;
  direction: "inbound" | "outbound";
  message_type: string;
  body: string;
  status: string;
  created_at: string;
  sent_by_name: string | null;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function formatPhone(waId: string) {
  if (waId.startsWith("91") && waId.length === 12) {
    return `+91 ${waId.slice(2, 7)} ${waId.slice(7)}`;
  }
  return waId;
}

function displayLabel(c: Conversation) {
  return c.user_name || c.lead_name || c.display_name || formatPhone(c.wa_id);
}

function isPendingMessage(m: Message) {
  return m.id < 0;
}

function mergeMessagesWithPending(
  serverMessages: Message[],
  pending: Message[]
): Message[] {
  const merged = [...serverMessages];
  for (const p of pending) {
    const alreadySaved = serverMessages.some(
      (m) =>
        m.direction === "outbound" &&
        m.body === p.body &&
        Math.abs(
          new Date(m.created_at).getTime() - new Date(p.created_at).getTime()
        ) < 60_000
    );
    if (!alreadySaved) merged.push(p);
  }
  return merged;
}

const CONVERSATIONS_POLL_MS = 30_000;
const MESSAGES_POLL_MS = 20_000;

export default function AdminWhatsAppPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const alert = useAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;
  const fetchUnreadCount = useWhatsAppStore((s) => s.fetchUnreadCount);
  const fetchUnreadCountRef = useRef(fetchUnreadCount);
  fetchUnreadCountRef.current = fetchUnreadCount;

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingConversations(true);
    try {
      const params = new URLSearchParams({ page_size: "50" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await authFetch(`myadmin/whatsapp/conversations/?${params}`);
      if (!res.ok) throw new Error("Failed to load conversations");
      const data: Paginated<Conversation> = await res.json();
      setConversations(sortConversationsByRecent(data.results || []));
    } catch {
      if (!silent) alertRef.current.error("Failed to load WhatsApp conversations");
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  }, [debouncedSearch]);

  const fetchMessages = useCallback(async (conversationId: number, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await authFetch(
        `myadmin/whatsapp/conversations/${conversationId}/messages/?page_size=100`
      );
      if (!res.ok) throw new Error("Failed to load messages");
      const data: Paginated<Message> = await res.json();
      const sorted = [...(data.results || [])].reverse();
      setMessages((prev) =>
        mergeMessagesWithPending(
          sorted,
          prev.filter(isPendingMessage)
        )
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        )
      );
      void fetchUnreadCountRef.current();
    } catch {
      if (!silent) alertRef.current.error("Failed to load messages");
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, []);

  const fetchConversationsRef = useRef(fetchConversations);
  fetchConversationsRef.current = fetchConversations;

  const fetchMessagesRef = useRef(fetchMessages);
  fetchMessagesRef.current = fetchMessages;

  useEffect(() => {
    if (selectedId) return;
    fetchConversationsRef.current(false);
    const interval = setInterval(
      () => fetchConversationsRef.current(true),
      CONVERSATIONS_POLL_MS
    );
    return () => clearInterval(interval);
  }, [debouncedSearch, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    fetchMessagesRef.current(selectedId, false);
    const interval = setInterval(
      () => fetchMessagesRef.current(selectedId, true),
      MESSAGES_POLL_MS
    );
    return () => clearInterval(interval);
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!selectedId || !draft.trim() || sending) return;

    const body = draft.trim();
    const tempId = -Date.now();
    const sentAt = new Date().toISOString();
    const optimisticMessage: Message = {
      id: tempId,
      direction: "outbound",
      message_type: "text",
      body,
      status: "sending",
      created_at: sentAt,
      sent_by_name: null,
    };

    setDraft("");
    setMessages((prev) => [...prev, optimisticMessage]);
    setConversations((prev) =>
      sortConversationsByRecent(
        prev.map((c) =>
          c.id === selectedId
            ? {
                ...c,
                last_message_preview: body.slice(0, 80),
                last_message_at: sentAt,
              }
            : c
        )
      )
    );

    setSending(true);
    try {
      const res = await authFetch(
        `myadmin/whatsapp/conversations/${selectedId}/send/`,
        {
          method: "POST",
          body: JSON.stringify({ body }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send message");
      }
      void fetchMessages(selectedId, true);
      void fetchConversations(true);
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(body);
      alert.error(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 h-full flex flex-col max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">WhatsApp Inbox</h1>
      </div>

      <div className="flex flex-1 min-h-0 gap-4 h-[calc(100vh-8rem)]">
        {/* Conversation list */}
        <div className="w-full md:w-80 shrink-0 flex flex-col bg-base-100 rounded-lg border border-base-300 overflow-hidden">
          <div className="p-3 border-b border-base-300">
            <label className="input input-bordered input-sm flex items-center gap-2">
              <Search className="size-4 opacity-60" />
              <input
                type="search"
                placeholder="Search name or number..."
                className="grow"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConversations && conversations.length === 0 ? (
              <p className="p-4 text-sm text-base-content/60">Loading...</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-base-content/60">
                No conversations yet. They appear when someone messages your
                WhatsApp business number.
              </p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full cursor-pointer text-left px-3 py-3 border-b border-base-200 hover:bg-base-200/60 transition-colors ${
                    selectedId === c.id ? "bg-base-200" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{displayLabel(c)}</p>
                      <p className="text-xs text-base-content/60">
                        {formatPhone(c.wa_id)}
                      </p>
                      {c.last_message_preview ? (
                        <p className="text-sm text-base-content/70 truncate mt-1">
                          {c.last_message_preview}
                        </p>
                      ) : null}
                    </div>
                    {c.unread_count > 0 ? (
                      <span className="badge badge-primary badge-sm shrink-0">
                        {c.unread_count}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message thread */}
        <div className="flex-1 flex flex-col bg-base-100 rounded-lg border border-base-300 overflow-hidden min-w-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-base-content/50">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-base-300">
                <p className="font-semibold">{displayLabel(selected)}</p>
                <p className="text-sm text-base-content/60">
                  {formatPhone(selected.wa_id)}
                  {selected.user_id ? " · Client" : null}
                  {selected.lead_id ? " · Lead" : null}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages && messages.length === 0 ? (
                  <p className="text-sm text-base-content/60">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-base-content/60">No messages yet.</p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${
                        m.direction === "outbound" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                          m.direction === "outbound"
                            ? `bg-primary text-primary-content${
                                m.status === "sending" ? " opacity-70" : ""
                              }`
                            : "bg-base-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            m.direction === "outbound"
                              ? "text-primary-content/70"
                              : "text-base-content/50"
                          }`}
                        >
                          {new Date(m.created_at).toLocaleString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "numeric",
                            month: "short",
                          })}
                          {m.status === "sending" ? " · Sending…" : ""}
                          {m.direction === "outbound" && m.sent_by_name
                            ? ` · ${m.sent_by_name}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-base-300">
                {!selected.can_reply_freeform ? (
                  <p className="text-xs text-warning mb-2">
                    Free-form replies are only available within 24 hours of the
                    customer&apos;s last message.
                  </p>
                ) : null}
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered flex-1"
                    placeholder={
                      selected.can_reply_freeform
                        ? "Type a message..."
                        : "Waiting for customer message..."
                    }
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={!selected.can_reply_freeform}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={
                      !selected.can_reply_freeform || !draft.trim()
                    }
                    onClick={handleSend}
                  >
                    <Send className="size-4" />
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
