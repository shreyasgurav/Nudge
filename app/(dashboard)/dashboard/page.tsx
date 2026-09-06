"use client";

/**
 * Unified Dashboard Page
 *
 * Shows both Nudge Automation metrics (top) and Instagram Account Analytics (bottom).
 */

import { useEffect, useState } from "react";
import AccountSelect, { type AccountOption } from "@/components/account-select";
import StatCard from "@/components/stat-card";
import StatusBadge from "@/components/status-badge";
import FollowerChart from "@/components/follower-chart";
import type { OverviewResponse } from "@/app/api/instagram/overview/route";

interface DashboardStats {
  userName: string | null;
  contactsCount: number;
  totalAutomations: number;
  activeAutomations: number;
  dmsSentToday: number;
  dmsSentWeek: number;
  dmsSentMonth: number;
  dmsSkippedMonth: number;
  dmsFailedMonth: number;
  totalDMs: number;
  clicksThisMonth: number;
  totalClicks: number;
  ctrThisMonth: number;
  instagramAccounts: AccountOption[];
  selectedInstagramAccountId: string | null;
  topKeywords: { keyword: string; count: number }[];
  dailyDMs: { date: string; count: number }[];
  recentLogs: Array<{
    id: string;
    commenterName: string | null;
    commentText: string;
    status: string;
    createdAt: string;
    automation: { name: string };
    instagramAccount?: { username: string };
  }>;
}

function formatNumber(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const COUNT_OPTIONS = [
  { value: "25", label: "Last 25" },
  { value: "50", label: "Last 50" },
  { value: "100", label: "Last 100" },
  { value: "all", label: "All time" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [count, setCount] = useState("50");

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedAccountId !== "all") {
      params.set("instagramAccountId", selectedAccountId);
    }

    // Fetch Dashboard Stats
    fetch(`/api/dashboard/stats${params.size ? `?${params}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch(console.error)
      .finally(() => setLoadingStats(false));
  }, [selectedAccountId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedAccountId !== "all") {
      params.set("instagramAccountId", selectedAccountId);
    }
    params.set("count", count);

    // Fetch Overview Data
    fetch(`/api/instagram/overview?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setOverview(res.data);
      })
      .catch(console.error)
      .finally(() => setLoadingOverview(false));
  }, [selectedAccountId, count]);

  function handleAccountChange(accountId: string) {
    setLoadingStats(true);
    setLoadingOverview(true);
    setSelectedAccountId(accountId);
  }

  function handleCountChange(next: string) {
    setLoadingOverview(true);
    setCount(next);
  }

  const isLoading = loadingStats || loadingOverview;

  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 h-32 animate-pulse" style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}>
              <div className="w-10 h-4 rounded-full" style={{ background: "#e8e8e4" }} />
              <div className="mt-4 h-7 w-16 rounded-xl" style={{ background: "#eeeeeb" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const maxDM = Math.max(...(stats?.dailyDMs.map((d) => d.count) ?? [1]), 1);
  const connectedCount = stats?.instagramAccounts.length ?? 0;

  // Overview destructuring
  const overviewData = overview;
  const posts = overviewData?.posts ?? [];
  const followers = overviewData?.followers ?? null;
  const followerHistory = overviewData?.followerHistory ?? [];
  const totals = overviewData?.totals ?? { views: null, reach: null, likes: null, comments: null, saved: null, shares: null, posts: 0 };
  const insightsAvailable = overviewData?.insightsAvailable ?? true;

  return (
    <div className="space-y-12 pb-12">
      {/* =========================================================================
          SECTION A: NUDGE AUTOMATION
          ========================================================================= */}
      <section className="space-y-8">
        {/* Greeting & Global Account Selector */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold"
              style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
            >
              Hello, {stats?.userName ?? "there"}!
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#7a7a72" }}>
              {connectedCount} connected{" "}
              {connectedCount === 1 ? "account" : "accounts"}
              {" · "}
              {stats?.contactsCount ?? 0}{" "}
              {stats?.contactsCount === 1 ? "contact" : "contacts"}
              {" · "}
              <a href="/logs" className="hover:underline" style={{ color: "#6B9FE8" }}>
                See activity
              </a>
            </p>
          </div>
          {stats && stats.instagramAccounts.length > 1 && (
            <AccountSelect
              accounts={stats.instagramAccounts}
              value={selectedAccountId}
              onChange={handleAccountChange}
            />
          )}
        </div>

        {/* Nudge Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            label="Active Campaigns"
            value={stats?.activeAutomations ?? 0}
          />
          <StatCard label="DMs Sent" value={stats?.dmsSentMonth ?? 0} />
          <StatCard label="Skipped" value={stats?.dmsSkippedMonth ?? 0} />
          <StatCard label="Failed" value={stats?.dmsFailedMonth ?? 0} />
          <StatCard label="Clicks" value={stats?.clicksThisMonth ?? 0} />
          <StatCard label="CTR" value={`${stats?.ctrThisMonth ?? 0}%`} />
        </div>

        {/* Chart + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 sm:gap-6">
          {/* 7-Day Chart */}
          <div
            className="lg:col-span-3 rounded-2xl p-4 sm:p-6"
            style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
          >
            <h2
              className="text-sm font-bold mb-6"
              style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
            >
              DMs — Last 7 Days
            </h2>
            <div className="flex items-end gap-1.5 h-40 sm:gap-2">
              {stats?.dailyDMs.map((day) => (
                <div key={day.date} className="min-w-0 flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "#7a7a72" }}>{day.count}</span>
                  <div
                    className="w-full min-h-[4px] rounded-full"
                    style={{ height: `${Math.max((day.count / maxDM) * 100, 4)}%`, background: "#6B9FE8" }}
                  />
                  <span className="w-full truncate text-center text-[10px]" style={{ color: "#a0a0a0" }}>
                    {day.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Keywords */}
          <div
            className="lg:col-span-1 rounded-2xl p-4 sm:p-6"
            style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
          >
            <h2
              className="text-sm font-bold mb-4"
              style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
            >
              Top Keywords
            </h2>
            <div className="space-y-3">
              {stats?.topKeywords.length === 0 && (
                <p className="text-sm py-8" style={{ color: "#a0a0a0" }}>No keyword matches yet</p>
              )}
              {stats?.topKeywords.map((keyword) => (
                <div key={keyword.keyword} className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium" style={{ color: "#1a1a1a" }}>
                    {keyword.keyword}
                  </span>
                  <span className="text-xs" style={{ color: "#7a7a72" }}>{keyword.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div
            className="lg:col-span-2 rounded-2xl p-4 sm:p-6"
            style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
          >
            <h2
              className="text-sm font-bold mb-4"
              style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
            >
              Recent Activity
            </h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {stats?.recentLogs.length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: "#a0a0a0" }}>No activity yet</p>
              )}
              {stats?.recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-3 py-2"
                  style={{ borderBottom: "1px solid #e8e8e4" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: "#1a1a1a" }}>
                      @{log.commenterName ?? "unknown"}
                    </p>
                    <p className="text-xs truncate" style={{ color: "#7a7a72" }}>
                      {log.instagramAccount
                        ? `@${log.instagramAccount.username} · `
                        : ""}
                      {log.commentText}
                    </p>
                  </div>
                  <StatusBadge status={log.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px w-full bg-[#e8e8e4]" />

      {/* =========================================================================
          SECTION B: INSTAGRAM ANALYTICS
          ========================================================================= */}
      <section className="space-y-6">
        {/* Header & Range Selector */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2
              className="text-xl sm:text-2xl font-bold"
              style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
            >
              Instagram Analytics
            </h2>
            {followers !== null && (
              <p className="mt-1 text-sm font-medium" style={{ color: "#1a1a1a" }}>
                {followers.toLocaleString()} total followers
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "#a0a0a0", fontFamily: "'Comfortaa', sans-serif" }}
              >
                Range
              </span>
              <div className="relative">
                <select
                  value={count}
                  onChange={(e) => handleCountChange(e.target.value)}
                  className="w-full appearance-none rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none cursor-pointer"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e8e8e4",
                    color: "#1a1a1a",
                    boxShadow: "0 1px 4px rgb(0 0 0 / 0.06)",
                  }}
                >
                  {COUNT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
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
            </label>
          </div>
        </div>

        {/* Insights permission notice - only show if there are posts but insights are unavailable */}
        {!insightsAvailable && posts.length > 0 && (
          <div
            className="rounded-2xl p-5"
            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
          >
            <p
              className="text-sm font-semibold"
              style={{ fontFamily: "'Comfortaa', sans-serif", color: "#92400e" }}
            >
              Views, reach, saved and shares need the insights permission.
            </p>
            <p className="text-sm mt-1" style={{ color: "#b45309" }}>
              Reconnect your account to grant it — likes and comments are shown in
              the meantime.
            </p>
            <a
              href="/api/instagram/connect"
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer"
              style={{
                background: "#6B9FE8",
                color: "white",
                boxShadow: "0 2px 8px rgb(107 159 232 / 0.3)",
                marginTop: "0.75rem",
              }}
            >
              Reconnect Instagram →
            </a>
          </div>
        )}

        {/* Aggregate stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard label="Views" value={formatNumber(totals.views)} />
          <StatCard label="Reach" value={formatNumber(totals.reach)} />
          <StatCard label="Likes" value={formatNumber(totals.likes)} />
          <StatCard label="Comments" value={formatNumber(totals.comments)} />
          <StatCard label="Saved" value={formatNumber(totals.saved)} />
          <StatCard label="Shares" value={formatNumber(totals.shares)} />
        </div>

        {/* Follower trend */}
        <FollowerChart data={followerHistory} followers={followers} />

        {/* Per-post table */}
        <div
          className="rounded-2xl p-4 sm:p-6"
          style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
        >
          <h2
            className="text-sm font-bold mb-5"
            style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
          >
            Posts
          </h2>
          {posts.length === 0 ? (
            <div
              className="rounded-xl py-10 text-center"
              style={{ background: "#f7f7f5" }}
            >
              <p className="text-sm" style={{ color: "#a0a0a0" }}>No posts found</p>
            </div>
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr
                    className="text-left text-xs uppercase tracking-wide"
                    style={{ borderBottom: "1px solid #e8e8e4", color: "#a0a0a0" }}
                  >
                    <th className="py-2 pr-4 font-semibold" style={{ fontFamily: "'Comfortaa', sans-serif" }}>Post</th>
                    <th className="py-2 px-3 font-semibold text-right" style={{ fontFamily: "'Comfortaa', sans-serif" }}>Views</th>
                    <th className="py-2 px-3 font-semibold text-right" style={{ fontFamily: "'Comfortaa', sans-serif" }}>Reach</th>
                    <th className="py-2 px-3 font-semibold text-right" style={{ fontFamily: "'Comfortaa', sans-serif" }}>Likes</th>
                    <th className="py-2 px-3 font-semibold text-right" style={{ fontFamily: "'Comfortaa', sans-serif" }}>Comments</th>
                    <th className="py-2 px-3 font-semibold text-right" style={{ fontFamily: "'Comfortaa', sans-serif" }}>Saved</th>
                    <th className="py-2 px-3 font-semibold text-right" style={{ fontFamily: "'Comfortaa', sans-serif" }}>Shares</th>
                    <th className="py-2 pl-3 font-semibold text-right" style={{ fontFamily: "'Comfortaa', sans-serif" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr
                      key={p.id}
                      style={{ borderBottom: "1px solid #f0f0ec" }}
                    >
                      <td className="py-3 pr-4 max-w-xs">
                        {p.permalink ? (
                          <a
                            href={p.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate block hover:underline cursor-pointer"
                            style={{ color: "#1a1a1a" }}
                          >
                            {p.caption || `${p.mediaType} post`}
                          </a>
                        ) : (
                          <span className="truncate block" style={{ color: "#1a1a1a" }}>
                            {p.caption || `${p.mediaType} post`}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right" style={{ color: "#7a7a72" }}>{formatNumber(p.views)}</td>
                      <td className="py-3 px-3 text-right" style={{ color: "#7a7a72" }}>{formatNumber(p.reach)}</td>
                      <td className="py-3 px-3 text-right" style={{ color: "#7a7a72" }}>{formatNumber(p.likes)}</td>
                      <td className="py-3 px-3 text-right" style={{ color: "#7a7a72" }}>{formatNumber(p.comments)}</td>
                      <td className="py-3 px-3 text-right" style={{ color: "#7a7a72" }}>{formatNumber(p.saved)}</td>
                      <td className="py-3 px-3 text-right" style={{ color: "#7a7a72" }}>{formatNumber(p.shares)}</td>
                      <td className="py-3 pl-3 text-right" style={{ color: "#a0a0a0" }}>{formatDate(p.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
