"use client";

import { Suspense, useEffect, useState } from "react";
import type { AccountOption } from "@/components/account-select";
import { InstagramConnectNotice } from "@/components/instagram-connect-notice";

interface SettingsData {
  workspace: {
    name: string;
    dmsSentThisPeriod: number;
  };
  instagramAccount: {
    id: string;
    username: string;
    instagramId: string;
    tokenExpiresAt: string | null;
    webhookSubscribed: boolean;
  } | null;
  instagramAccounts: Array<
    AccountOption & {
      tokenExpiresAt: string | null;
      webhookSubscribed: boolean;
    }
  >;
}

interface WorkspaceMembersData {
  currentUserRole: "OWNER" | "ADMIN" | "MEMBER";
  members: Array<{
    id: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    createdAt: string;
    user: {
      id: string;
      email: string | null;
      name: string | null;
    };
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    inviteUrl: string;
    expiresAt: string;
  }>;
}

/**
 * Classify an Instagram token's expiry into a friendly status. This is the
 * creator-facing replacement for the raw "token refresh failures" that used to
 * live on the Diagnostics page — creators only need to know whether they must
 * reconnect, not the underlying API error.
 */
function getTokenStatus(tokenExpiresAt: string | null): {
  label: string;
  color: string;
  bg: string;
  needsReconnect: boolean;
} {
  if (!tokenExpiresAt) {
    return { label: "Active", color: "#16a34a", bg: "#dcfce7", needsReconnect: false };
  }
  const expiry = new Date(tokenExpiresAt).getTime();
  const now = Date.now();
  const days = (expiry - now) / (1000 * 60 * 60 * 24);

  if (days <= 0) {
    return { label: "Expired", color: "#dc2626", bg: "#fee2e2", needsReconnect: true };
  }
  if (days <= 7) {
    return { label: "Expiring soon", color: "#a16207", bg: "#fef9c3", needsReconnect: true };
  }
  return { label: "Active", color: "#16a34a", bg: "#dcfce7", needsReconnect: false };
}

/** Consistent section card used throughout the settings page */
function Card({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
    >
      {/* Card header */}
      <div
        className="px-5 py-4"
        style={{ borderBottom: "1px solid #e8e8e4" }}
      >
        <h2
          className="text-sm font-bold"
          style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
        >
          {title}
        </h2>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 space-y-0">{children}</div>

      {/* Card footer (optional) */}
      {footer && (
        <div
          className="px-5 py-4"
          style={{ borderTop: "1px solid #e8e8e4" }}
        >
          {footer}
        </div>
      )}
    </section>
  );
}

/** A single label + value row inside a Card */
function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-3.5"
      style={{ borderBottom: "1px solid #f0f0ec" }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
          {label}
        </p>
        {hint && (
          <p className="text-xs mt-0.5" style={{ color: "#a0a0a0" }}>
            {hint}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [membersData, setMembersData] = useState<WorkspaceMembersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [memberError, setMemberError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/stats").then((r) => r.json()),
      fetch("/api/workspace/members").then((r) => r.json()),
    ])
      .then(([statsPayload, membersPayload]) => {
        if (statsPayload.success) setData(statsPayload.data);
        if (membersPayload.success) setMembersData(membersPayload.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function refreshMembers() {
    const res = await fetch("/api/workspace/members");
    const payload = await res.json();
    if (payload.success) setMembersData(payload.data);
  }

  async function disconnectInstagram(instagramAccountId: string) {
    if (!confirm("Disconnect Instagram? Campaigns for this account will stop sending DMs.")) return;
    setBusy(`disconnect:${instagramAccountId}`);
    await fetch("/api/instagram/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instagramAccountId }),
    });
    window.location.reload();
  }

  async function inviteMember(event: React.FormEvent) {
    event.preventDefault();
    setMemberError(null);
    setBusy("invite");
    const res = await fetch("/api/workspace/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const payload = await res.json();
    if (payload.success) {
      setMembersData(payload.data);
      setInviteEmail("");
    } else {
      setMemberError(payload.error ?? "Could not invite member");
    }
    setBusy(null);
  }

  async function removeInvitation(invitationId: string) {
    setBusy(`invite:${invitationId}`);
    await fetch("/api/workspace/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId }),
    });
    await refreshMembers();
    setBusy(null);
  }

  async function copyInviteUrl(id: string, url: string) {
    await navigator.clipboard?.writeText(url);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl h-40 animate-pulse"
            style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
          />
        ))}
      </div>
    );
  }

  const accounts = data?.instagramAccounts ?? [];
  const canManageMembers =
    membersData?.currentUserRole === "OWNER" ||
    membersData?.currentUserRole === "ADMIN";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Surfaces the ?instagram= OAuth redirect notice */}
      <Suspense fallback={null}>
        <InstagramConnectNotice />
      </Suspense>

      {/* ── Instagram Connection ──────────────────────────── */}
      <Card
        title="Instagram Connection"
        footer={
          <a
            href="/api/instagram/connect"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
            style={{
              background: "#6B9FE8",
              color: "white",
              boxShadow: "0 2px 8px rgb(107 159 232 / 0.3)",
            }}
          >
            {accounts.length > 0 ? "Connect another account" : "Connect Instagram"}
          </a>
        }
      >
        <Row
          label="Status"
          hint="Comment webhooks and private replies depend on this connection."
        >
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={
              accounts.length > 0
                ? { background: "#dcfce7", color: "#16a34a" }
                : { background: "#fef9c3", color: "#a16207" }
            }
          >
            {accounts.length > 0 ? "Connected" : "Not connected"}
          </span>
        </Row>

        <Row
          label="Accounts"
          hint={`${accounts.length} connected Instagram profile${accounts.length === 1 ? "" : "s"}`}
        >
          <span className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>
            {accounts.length > 0 ? `${accounts.length} connected` : "None"}
          </span>
        </Row>

        {/* Per-account rows */}
        {accounts.length === 0 && (
          <p className="py-3 text-sm" style={{ color: "#a0a0a0" }}>
            Connect an Instagram professional account to launch campaigns.
          </p>
        )}
        {accounts.map((account) => {
          const tokenStatus = getTokenStatus(account.tokenExpiresAt);
          return (
            <div key={account.id} style={{ marginTop: "0.75rem" }}>
              <div
                className="flex flex-col gap-3 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                style={{ background: "#f7f7f5" }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className="text-sm font-semibold"
                      style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
                    >
                      @{account.username}
                    </p>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: tokenStatus.bg, color: tokenStatus.color }}
                    >
                      {tokenStatus.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs" style={{ color: "#a0a0a0" }}>
                    Token expires{" "}
                    {account.tokenExpiresAt
                      ? new Date(account.tokenExpiresAt).toLocaleDateString()
                      : "not available"}{" "}
                    ·{" "}
                    <span
                      style={{
                        color: account.webhookSubscribed ? "#16a34a" : "#a16207",
                      }}
                    >
                      {account.webhookSubscribed ? "Webhook ready" : "Webhook pending"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {tokenStatus.needsReconnect && (
                    <a
                      href="/api/instagram/connect"
                      className="cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-all"
                      style={{
                        background: "#6B9FE8",
                        color: "white",
                        boxShadow: "0 2px 8px rgb(107 159 232 / 0.3)",
                      }}
                    >
                      Reconnect
                    </a>
                  )}
                  <button
                    onClick={() => disconnectInstagram(account.id)}
                    disabled={busy === `disconnect:${account.id}`}
                    className="cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-default"
                    style={{
                      background: "#fee2e2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                    }}
                  >
                    {busy === `disconnect:${account.id}` ? "Disconnecting…" : "Disconnect"}
                  </button>
                </div>
              </div>

              {tokenStatus.needsReconnect && (
                <p className="mt-1.5 px-1 text-xs" style={{ color: tokenStatus.color }}>
                  {tokenStatus.label === "Expired"
                    ? "This connection has expired. Reconnect to keep sending DMs."
                    : "This connection expires soon. Reconnect to avoid interruption." }
                </p>
              )}
            </div>
          );
        })}
      </Card>

      {/* ── Team ─────────────────────────────────────────── */}
      <Card
        title="Team"
        footer={
          canManageMembers ? (
            <form
              onSubmit={inviteMember}
              className="flex flex-col gap-3 sm:flex-row sm:items-start"
            >
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@agency.com"
                required
                className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: "#f7f7f5",
                  border: "1px solid #e8e8e4",
                  color: "#1a1a1a",
                  boxShadow: "0 1px 4px rgb(0 0 0 / 0.04)",
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
              <div className="relative">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}
                  className="w-full appearance-none rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none"
                  style={{
                    backgroundColor: "#f7f7f5",
                    border: "1px solid #e8e8e4",
                    color: "#1a1a1a",
                  }}
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a0a0a0]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <button
                type="submit"
                disabled={busy === "invite"}
                className="cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-default"
                style={{
                  background: "#6B9FE8",
                  color: "white",
                  boxShadow: "0 2px 8px rgb(107 159 232 / 0.3)",
                }}
              >
                {busy === "invite" ? "Inviting…" : "Invite"}
              </button>
              {memberError && (
                <p className="w-full text-sm" style={{ color: "#dc2626" }}>
                  {memberError}
                </p>
              )}
            </form>
          ) : undefined
        }
      >
        {/* Members */}
        {membersData?.members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between gap-4 py-3.5"
            style={{ borderBottom: "1px solid #f0f0ec" }}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: "#1a1a1a" }}>
                {member.user.name ?? member.user.email ?? "Unknown member"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#a0a0a0" }}>
                {member.user.email}
              </p>
            </div>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: "#f0f0ec", color: "#7a7a72", border: "1px solid #e8e8e4" }}
            >
              {member.role}
            </span>
          </div>
        ))}

        {/* Pending invites */}
        {membersData?.invitations.length ? (
          <div className="pt-4 mt-2">
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-wide"
              style={{ fontFamily: "'Comfortaa', sans-serif", color: "#a0a0a0" }}
            >
              Pending invites
            </p>
            <div className="space-y-2">
              {membersData.invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-col gap-3 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  style={{ background: "#f7f7f5" }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: "#1a1a1a" }}>
                      {inv.email}
                    </p>
                    <p className="truncate text-xs mt-0.5" style={{ color: "#a0a0a0" }}>
                      {inv.role} · {inv.inviteUrl}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void copyInviteUrl(inv.id, inv.inviteUrl)}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                      style={{ background: "#f0f0ec", color: "#7a7a72", border: "1px solid #e8e8e4" }}
                    >
                      {copiedId === inv.id ? "Copied!" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeInvitation(inv.id)}
                      disabled={busy === `invite:${inv.id}`}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50"
                      style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" }}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      {/* ── Usage ─────────────────────────────────────────── */}
      <Card title="Usage">
        <Row
          label="DMs sent this month"
          hint="Self-hosted — no plan limits."
        >
          <span
            className="text-2xl font-bold"
            style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
          >
            {data?.workspace.dmsSentThisPeriod ?? 0}
          </span>
        </Row>
      </Card>
    </div>
  );
}
