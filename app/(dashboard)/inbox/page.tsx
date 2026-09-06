"use client";

/**
 * Inbox
 *
 * Instagram DM conversations for the selected account, with live message
 * history and a reply composer. Messages are read from the Conversations API
 * (Meta only exposes the 20 most recent per thread) and refreshed by polling.
 * Sending is subject to Instagram's 24-hour messaging window — Meta's error is
 * surfaced verbatim when it applies.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import AccountSelect, { type AccountOption } from "@/components/account-select";
import { readCache, writeCache } from "@/lib/client-cache";
import type { ConversationListItem } from "@/app/api/instagram/conversations/route";
import type { ThreadMessage } from "@/app/api/instagram/conversations/[id]/route";

const POLL_MS = 12_000;
const CACHE_MAX_AGE_MS = 60_000;
const convCacheKey = (accountId: string) => `inbox:convs:${accountId}`;
const msgCacheKey = (conversationId: string) => `inbox:msgs:${conversationId}`;

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function InboxPage() {
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.sessionStorage.getItem("inbox:selectedAccount") ?? "";
  });

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [convError, setConvError] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const active = conversations.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    fetch("/api/instagram/accounts")
      .then((r) => r.json())
      .then((payload) => {
        if (!payload.success) return;
        const next: AccountOption[] = payload.data.instagramAccounts ?? [];
        setAccounts(next);
        setSelectedAccountId((prev) => {
          const stillValid = prev && next.some((a) => a.id === prev);
          return stillValid
            ? prev
            : payload.data.selectedInstagramAccountId || next[0]?.id || "";
        });
      })
      .catch(() => setAccounts([]));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !selectedAccountId) return;
    window.sessionStorage.setItem("inbox:selectedAccount", selectedAccountId);
  }, [selectedAccountId]);

  const loadConversations = useCallback(
    async (silent: boolean) => {
      if (!selectedAccountId) return;
      if (!silent) setConvLoading(true);
      try {
        const res = await fetch(
          `/api/instagram/conversations?instagramAccountId=${selectedAccountId}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (data.success) {
          setConversations(data.data.conversations);
          writeCache(convCacheKey(selectedAccountId), data.data.conversations);
          setConvError(null);
        } else if (!silent) {
          setConvError(data.error ?? "Failed to load conversations");
        }
      } catch {
        if (!silent) setConvError("Failed to load conversations");
      } finally {
        if (!silent) setConvLoading(false);
      }
    },
    [selectedAccountId]
  );

  useEffect(() => {
    if (!selectedAccountId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveId(null);
    setMessages([]);
    const cached = readCache<ConversationListItem[]>(
      convCacheKey(selectedAccountId),
      CACHE_MAX_AGE_MS
    );
    if (cached.data) {
      setConversations(cached.data);
      setConvLoading(false);
    } else {
      setConversations([]);
      setConvLoading(true);
    }
    void loadConversations(Boolean(cached.data));
    const timer = window.setInterval(() => void loadConversations(true), POLL_MS);
    return () => window.clearInterval(timer);
  }, [selectedAccountId, loadConversations]);

  const loadMessages = useCallback(
    async (conversationId: string, silent: boolean) => {
      if (!selectedAccountId) return;
      if (!silent) setThreadLoading(true);
      try {
        const res = await fetch(
          `/api/instagram/conversations/${conversationId}?instagramAccountId=${selectedAccountId}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (data.success) {
          setMessages(data.data.messages);
          writeCache(msgCacheKey(conversationId), data.data.messages);
        }
      } catch {
        // keep whatever is shown
      } finally {
        if (!silent) setThreadLoading(false);
      }
    },
    [selectedAccountId]
  );

  useEffect(() => {
    if (!activeId) return;
    const cached = readCache<ThreadMessage[]>(msgCacheKey(activeId), CACHE_MAX_AGE_MS);
    if (cached.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages(cached.data);
      setThreadLoading(false);
    } else {
      setMessages([]);
      setThreadLoading(true);
    }
    void loadMessages(activeId, Boolean(cached.data));
    const timer = window.setInterval(
      () => void loadMessages(activeId, true),
      POLL_MS
    );
    return () => window.clearInterval(timer);
  }, [activeId, loadMessages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function openConversation(id: string) {
    setActiveId(id);
    setSendError(null);
    const cached = readCache<ThreadMessage[]>(msgCacheKey(id), CACHE_MAX_AGE_MS);
    setMessages(cached.data ?? []);
    setThreadLoading(!cached.data);
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || !active?.contact.id || sending) return;
    setSending(true);
    setSendError(null);

    const optimistic: ThreadMessage = {
      id: `optimistic-${Date.now()}`,
      text,
      fromMe: true,
      fromUsername: null,
      createdTime: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");

    try {
      const res = await fetch("/api/instagram/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagramAccountId: selectedAccountId,
          recipientId: active.contact.id,
          text,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await loadMessages(active.id, true);
        void loadConversations(true);
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setDraft(text);
        setSendError(data.error ?? "Failed to send message");
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(text);
      setSendError("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div>

      {/* Main panel */}
      <div
        className="grid overflow-hidden rounded-2xl sm:grid-cols-[300px_1fr]"
        style={{
          background: "#ffffff",
          border: "1px solid #e8e8e4",
          height: "calc(100dvh - 7rem)",
        }}
      >
        {/* ── Conversation list ─────────────────────────────── */}
        <div
          className={`min-h-0 flex-col sm:flex sm:border-r ${
            active ? "hidden" : "flex"
          }`}
          style={{ borderColor: "#e8e8e4" }}
        >
          {/* List header — same height as TopBar so the border aligns */}
          <div
            className="shrink-0 flex items-center justify-between gap-3 px-5"
            style={{
              height: "calc(3.75rem + env(safe-area-inset-top))",
              paddingTop: "env(safe-area-inset-top)",
              borderBottom: "1px solid #e8e8e4",
              flexShrink: 0,
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ fontFamily: "'Comfortaa', sans-serif", color: "#a0a0a0" }}
            >
              Conversations
            </p>
            {accounts.length > 1 && (
              <AccountSelect
                accounts={accounts}
                value={selectedAccountId}
                onChange={setSelectedAccountId}
                includeAll={false}
              />
            )}
          </div>

          {/* List body */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {convLoading ? (
              /* Skeleton */
              <div className="space-y-px p-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl px-3 py-3 animate-pulse"
                    style={{ background: "#f7f7f5" }}
                  >
                    <div className="flex justify-between mb-2">
                      <div className="h-3 w-24 rounded-full" style={{ background: "#e8e8e4" }} />
                      <div className="h-3 w-10 rounded-full" style={{ background: "#e8e8e4" }} />
                    </div>
                    <div className="h-2.5 w-36 rounded-full" style={{ background: "#eeeeeb" }} />
                  </div>
                ))}
              </div>
            ) : convError ? (
              <p className="px-5 py-6 text-sm" style={{ color: "#dc2626" }}>
                {convError}
              </p>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 px-5 text-center">
                <p className="text-sm" style={{ color: "#a0a0a0" }}>
                  No conversations yet.
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-px">
                {conversations.map((c) => {
                  const isActive = c.id === activeId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => openConversation(c.id)}
                      className="block w-full rounded-xl px-3 py-3 text-left transition-colors"
                      style={{
                        background: isActive ? "#eeeeeb" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          (e.currentTarget as HTMLButtonElement).style.background = "#f7f7f5";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive)
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      }}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className="truncate text-sm font-semibold"
                          style={{
                            fontFamily: "'Comfortaa', sans-serif",
                            color: "#1a1a1a",
                          }}
                        >
                          @{c.contact.username ?? "unknown"}
                        </span>
                        <span
                          className="shrink-0 text-[11px]"
                          style={{ color: "#a0a0a0" }}
                        >
                          {formatTime(c.updatedTime)}
                        </span>
                      </div>
                      {c.lastMessage && (
                        <p
                          className="mt-0.5 truncate text-xs"
                          style={{ color: "#7a7a72" }}
                        >
                          {c.lastMessage.fromMe ? "You: " : ""}
                          {c.lastMessage.text || "(no text)"}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Thread pane ───────────────────────────────────── */}
        <div className={`min-h-0 flex-col ${active ? "flex" : "hidden sm:flex"}`}>
          {!active ? (
            <div
              className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center"
              style={{ background: "#f7f7f5" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "#eeeeeb" }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M2 5a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 3V5z"
                    stroke="#a0a0a0"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-sm" style={{ color: "#a0a0a0" }}>
                Select a conversation to read and reply
              </p>
            </div>
          ) : (
            <>
              {/* Thread header — same height as TopBar so border aligns */}
              <div
                className="flex shrink-0 items-center gap-2 px-5"
                style={{
                  height: "calc(3.75rem + env(safe-area-inset-top))",
                  paddingTop: "env(safe-area-inset-top)",
                  borderBottom: "1px solid #e8e8e4",
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="sm:hidden -ml-1 rounded-xl px-3 py-1.5 text-sm transition-colors"
                  aria-label="Back to conversations"
                  style={{ color: "#7a7a72", background: "#f0f0ec" }}
                >
                  ← Back
                </button>
                <span
                  className="truncate text-sm font-bold"
                  style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
                >
                  @{active.contact.username ?? "unknown"}
                </span>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto p-5 space-y-3"
                style={{ background: "#f7f7f5" }}
              >
                {threadLoading && messages.length === 0 ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className="h-9 rounded-2xl animate-pulse"
                          style={{
                            width: `${120 + i * 20}px`,
                            background: i % 2 === 0 ? "#e8e8e4" : "#c7d8f5",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-center pt-8" style={{ color: "#a0a0a0" }}>
                    No messages.
                  </p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm"
                        style={
                          m.fromMe
                            ? {
                                background: "#6B9FE8",
                                color: "white",
                                boxShadow: "0 2px 8px rgb(107 159 232 / 0.3)",
                              }
                            : {
                                background: "#ffffff",
                                color: "#1a1a1a",
                                border: "1px solid #e8e8e4",
                              }
                        }
                      >
                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                          {m.text}
                        </p>
                        <p
                          className="mt-1 text-[10px]"
                          style={{ color: m.fromMe ? "rgba(255,255,255,0.65)" : "#a0a0a0" }}
                        >
                          {formatTime(m.createdTime)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Composer */}
              <div
                className="shrink-0 px-4 py-3"
                style={{ borderTop: "1px solid #e8e8e4", background: "#ffffff" }}
              >
                {sendError && (
                  <p
                    className="mb-2 text-xs rounded-xl px-3 py-2"
                    style={{ color: "#dc2626", background: "#fef2f2" }}
                  >
                    {sendError}
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Write a reply… (Enter to send, Shift+Enter for new line)"
                    className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm outline-none transition-all"
                    style={{
                      background: "#f7f7f5",
                      border: "1px solid #e8e8e4",
                      color: "#1a1a1a",
                      minHeight: "42px",
                      maxHeight: "128px",
                      fontFamily: "system-ui, -apple-system, sans-serif",
                      boxShadow: "0 1px 4px rgb(0 0 0 / 0.04)",
                      WebkitTapHighlightColor: "transparent",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#6B9FE8";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgb(107 159 232 / 0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#e8e8e4";
                      e.currentTarget.style.boxShadow = "0 1px 4px rgb(0 0 0 / 0.04)";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={sending || !draft.trim()}
                    className="shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
                    style={{
                      background:
                        sending || !draft.trim() ? "#d0d0ca" : "#6B9FE8",
                      color: "white",
                      boxShadow:
                        sending || !draft.trim()
                          ? "none"
                          : "0 2px 8px rgb(107 159 232 / 0.35)",
                      cursor: sending || !draft.trim() ? "not-allowed" : "pointer",
                    }}
                  >
                    {sending ? "Sending…" : "Send"}
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
