"use client";

/**
 * Campaigns List Page
 *
 * Shows all campaigns as cards with toggle and delete.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccountSelect, { type AccountOption } from "@/components/account-select";
import { readCache, writeCache } from "@/lib/client-cache";

interface Campaign {
  id: string;
  name: string;
  goal: string | null;
  postId: string | null;
  postUrl: string | null;
  pendingNextReel: boolean;
  matchAnyPost: boolean;
  keywords: string[];
  matchAnyWord: boolean;
  dmMessage: string;
  openingDmEnabled: boolean;
  openingDmMessage: string | null;
  openingDmButtonLabel: string | null;
  publicReplyEnabled: boolean;
  publicReplyMessage: string | null;
  publicReplyMessages: string[];
  requireFollow: boolean;
  followPromptMessage: string | null;
  followPromptButtonLabel: string | null;
  isActive: boolean;
  wholeWordMatch: boolean;
  instagramAccountId: string;
  instagramAccount: {
    username: string;
    instagramId: string;
  };
  reportShareSlug: string | null;
  reportShareEnabled: boolean;
  reportUrl: string | null;
  createdAt: string;
  _count: { dmLogs: number };
  trackedLinks: Array<{
    id: string;
    slug: string;
    label: string | null;
    destinationUrl: string;
    trackedUrl: string;
    _count: { clicks: number };
  }>;
  analytics: {
    sent: number;
    skipped: number;
    failed: number;
    clicks: number;
    ctr: number;
    topKeywords: { keyword: string; count: number }[];
  };
}

export default function CampaignsPage() {
  const router = useRouter();
  const [automations, setAutomations] = useState<Campaign[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [loading, setLoading] = useState(true);
  // postId -> current thumbnail URL, fetched live (Instagram URLs expire, so
  // they are never stored on the campaign).
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  // postId -> video URL for reels, so a campaign thumbnail can play on click.
  const [videos, setVideos] = useState<Record<string, string>>({});
  // The reel currently playing in the lightbox (null when closed).
  const [playingVideo, setPlayingVideo] = useState<{
    url: string;
    postUrl: string | null;
  } | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">(
    "all"
  );

  const fetchAutomations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedAccountId !== "all") {
        params.set("instagramAccountId", selectedAccountId);
      }
      const res = await fetch(
        `/api/automations${params.size ? `?${params}` : ""}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.success) setAutomations(data.data);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) setAccounts(payload.data.instagramAccounts ?? []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchAutomations();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAutomations]);

  // Fetch fresh post thumbnails (and reel video URLs) for the accounts in view
  // and map them by postId. Cache-first so they show instantly on a return
  // visit. Instagram URLs expire, so they are never stored on the campaign.
  useEffect(() => {
    if (automations.length === 0) return;
    let cancelled = false;
    const accountIds = Array.from(
      new Set(automations.map((a) => a.instagramAccountId))
    ).sort();
    const cacheKey = `ig-media:${accountIds.join(",")}`;

    const cached = readCache<{
      thumbs: Record<string, string>;
      videos: Record<string, string>;
    }>(cacheKey, 15 * 60 * 1000);
    // Hydrating state from cache is a legitimate effect use here.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (cached.data) {
      setThumbnails(cached.data.thumbs);
      setVideos(cached.data.videos);
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    Promise.all(
      accountIds.map((accountId) =>
        fetch(`/api/instagram/posts?instagramAccountId=${accountId}&limit=50`)
          .then((res) => res.json())
          .then((payload) =>
            payload.success
              ? (payload.data as {
                  id: string;
                  media_type?: string;
                  media_url?: string;
                  thumbnail_url?: string;
                }[])
              : []
          )
          .catch(() => [])
      )
    ).then((lists) => {
      if (cancelled) return;
      const thumbs: Record<string, string> = {};
      const vids: Record<string, string> = {};
      for (const list of lists) {
        for (const media of list) {
          const url = media.thumbnail_url ?? media.media_url;
          if (url) thumbs[media.id] = url;
          if (media.media_type === "VIDEO" && media.media_url) {
            vids[media.id] = media.media_url;
          }
        }
      }
      setThumbnails(thumbs);
      setVideos(vids);
      writeCache(cacheKey, { thumbs, videos: vids });
    });

    return () => {
      cancelled = true;
    };
  }, [automations]);

  // Close the reel lightbox on Escape.
  useEffect(() => {
    if (!playingVideo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlayingVideo(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playingVideo]);

  function handleAccountChange(accountId: string) {
    setLoading(true);
    setSelectedAccountId(accountId);
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await fetch(`/api/automations?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: !isActive } : a))
      );
    } catch (err) {
      console.error("Failed to toggle:", err);
    }
  }

  async function copyReelUrl(auto: Campaign) {
    setMenuOpenId(null);
    if (!auto.postUrl) return;
    try {
      await navigator.clipboard.writeText(auto.postUrl);
      setCopiedId(auto.id);
      window.setTimeout(
        () => setCopiedId((cur) => (cur === auto.id ? null : cur)),
        1500
      );
    } catch (err) {
      console.error("Failed to copy reel URL:", err);
    }
  }

  async function deleteAutomation(id: string) {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    try {
      await fetch(`/api/automations?id=${id}`, { method: "DELETE" });
      setAutomations((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  }

  async function duplicateAutomation(auto: Campaign) {
    setMenuOpenId(null);
    const specific = !auto.matchAnyPost && !auto.pendingNextReel;
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${auto.name} copy`,
          instagramAccountId: auto.instagramAccountId,
          postId: specific ? auto.postId : null,
          postUrl: specific ? auto.postUrl : null,
          matchAnyPost: auto.matchAnyPost,
          pendingNextReel: auto.pendingNextReel,
          matchAnyWord: auto.matchAnyWord,
          keywords: auto.keywords,
          dmMessage: auto.dmMessage,
          openingDmEnabled: auto.openingDmEnabled,
          openingDmMessage: auto.openingDmMessage,
          openingDmButtonLabel: auto.openingDmButtonLabel,
          publicReplyEnabled: auto.publicReplyEnabled,
          publicReplyMessages: auto.publicReplyMessages,
          trackedDestinationUrl: auto.trackedLinks[0]?.destinationUrl ?? "",
          secondaryDestinationUrl: auto.trackedLinks[1]?.destinationUrl ?? "",
          secondaryButtonLabel: auto.trackedLinks[1]?.label ?? "Open link",
          requireFollow: auto.requireFollow,
          followPromptMessage: auto.followPromptMessage,
          followPromptButtonLabel: auto.followPromptButtonLabel,
          wholeWordMatch: auto.wholeWordMatch,
          isActive: false,
        }),
      });
      const data = await res.json();
      if (data.success) void fetchAutomations();
      else console.error("Duplicate failed:", data.error);
    } catch (err) {
      console.error("Failed to duplicate:", err);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-6 h-36 animate-pulse"
            style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
          />
        ))}
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const filtered = automations.filter((a) => {
    if (statusFilter === "active" && !a.isActive) return false;
    if (statusFilter === "paused" && a.isActive) return false;
    if (!query) return true;
    return (
      a.name.toLowerCase().includes(query) ||
      a.keywords.some((k) => k.toLowerCase().includes(query)) ||
      a.dmMessage.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm" style={{ color: "#7a7a72" }}>
            {filtered.length}
            {filtered.length !== automations.length
              ? ` of ${automations.length}`
              : ""}{" "}
            campaign{automations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {accounts.length > 1 && (
            <AccountSelect
              accounts={accounts}
              value={selectedAccountId}
              onChange={handleAccountChange}
            />
          )}
          <Link
            href="/campaigns/import"
            className="flex-1 rounded-full px-4 py-2 text-center text-sm font-semibold transition-all sm:flex-none"
            style={{
              background: "#f0f0ec",
              color: "#7a7a72",
              border: "1px solid #e8e8e4",
            }}
          >
            Import
          </Link>
          <Link
            href="/campaigns/new"
            className="flex-1 rounded-full px-5 py-2 text-center text-sm font-semibold transition-all sm:flex-none"
            style={{
              background: "#6B9FE8",
              color: "white",
              boxShadow: "0 2px 8px rgb(107 159 232 / 0.3)",
            }}
          >
            New Campaign
          </Link>
        </div>
      </div>

      {/* Search + status filter */}
      {automations.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, keyword, or message…"
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
            style={{
              background: "#ffffff",
              border: "1px solid #e8e8e4",
              color: "#1a1a1a",
              boxShadow: "0 1px 4px rgb(0 0 0 / 0.05)",
            }}
          />
          <div
            className="inline-flex shrink-0 rounded-full p-1"
            style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
          >
            {(["all", "active", "paused"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className="rounded-full px-4 py-1.5 text-sm capitalize transition-all"
                style={{
                  background: statusFilter === s ? "#6B9FE8" : "transparent",
                  color: statusFilter === s ? "white" : "#7a7a72",
                  fontWeight: statusFilter === s ? 600 : 400,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {automations.length === 0 && (
        <div
          className="rounded-2xl p-8 text-center sm:p-12"
          style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
        >
          <h3
            className="text-lg font-bold mb-2"
            style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
          >
            No campaigns yet
          </h3>
          <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "#7a7a72" }}>
            Create your first comment-to-DM campaign to turn a post or reel into a measurable conversation flow.
          </p>
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all"
            style={{
              background: "#6B9FE8",
              color: "white",
              boxShadow: "0 4px 14px rgb(107 159 232 / 0.35)",
            }}
          >
            Create Campaign
          </Link>
        </div>
      )}

      {/* No matches for the current filter */}
      {automations.length > 0 && filtered.length === 0 && (
        <div
          className="rounded-2xl p-8 text-center text-sm"
          style={{ background: "#ffffff", border: "1px solid #e8e8e4", color: "#7a7a72" }}
        >
          No campaigns match your search.
        </div>
      )}

      {/* Campaign cards */}
      <div className="space-y-3">
        {filtered.map((auto) => {
          const videoUrl = auto.postId ? videos[auto.postId] : undefined;
          return (
          <div
            key={auto.id}
            onClick={() => router.push(`/campaigns/${auto.id}`)}
            className="rounded-2xl p-4 sm:p-5 transition-all cursor-pointer"
            style={{
              background: "#ffffff",
              border: "1px solid #e8e8e4",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgb(0 0 0 / 0.07)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "#d0d0ca";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              (e.currentTarget as HTMLDivElement).style.borderColor = "#e8e8e4";
            }}
          >
            {/* Wraps rather than compressing: on a phone the action buttons drop
                to their own line instead of squeezing the campaign summary. */}
            <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
              {auto.postId && thumbnails[auto.postId] && (
                videoUrl ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlayingVideo({ url: videoUrl, postUrl: auto.postUrl });
                    }}
                    aria-label="Play reel preview"
                    className="shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnails[auto.postId]}
                      alt="Campaign reel"
                      className="w-12 h-12 rounded object-cover border border-border hover:border-border-hover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </button>
                ) : (
                  <a
                    href={auto.postUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnails[auto.postId]}
                      alt="Campaign post"
                      className="w-12 h-12 rounded object-cover border border-border"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </a>
                )
              )}
              <div className="min-w-[12rem] flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3
                    className="text-sm font-bold truncate"
                    style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
                  >
                    {auto.name}
                  </h3>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ background: "#f0f0ec", color: "#7a7a72", border: "1px solid #e8e8e4" }}
                  >
                    @{auto.instagramAccount.username}
                  </span>
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    style={{
                      background: auto.isActive ? "#dcfce7" : "#f0f0ec",
                      color: auto.isActive ? "#16a34a" : "#7a7a72",
                    }}
                  >
                    {auto.isActive ? "Active" : "Paused"}
                  </span>
                  {auto.pendingNextReel && (
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ background: "#fef9c3", color: "#a16207" }}
                    >
                      Waiting for next reel
                    </span>
                  )}
                  {auto.requireFollow && (
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ background: "#dbeafe", color: "#1d4ed8" }}
                    >
                      Follow gate
                    </span>
                  )}
                  {auto.trackedLinks.length >= 2 && (
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ background: "#dbeafe", color: "#1d4ed8" }}
                    >
                      2 links
                    </span>
                  )}
                </div>

                {/* Keywords */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {auto.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: "#dbeafe", color: "#1d4ed8" }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>

                {/* DM preview */}
                <p className="text-sm truncate" style={{ color: "#7a7a72" }}>&ldquo;{auto.dmMessage}&rdquo;</p>

                {/* Tracked link sent */}
                {auto.trackedLinks[0]?.trackedUrl && (
                  <p className="mt-2 truncate font-mono text-xs text-zinc-500">
                    {auto.trackedLinks[0].trackedUrl}
                  </p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs" style={{ color: "#a0a0a0" }}>
                  <span className="font-semibold" style={{ color: "#1a1a1a" }}>
                    {auto._count.dmLogs} runs
                  </span>
                  <span>·</span>
                  <span className="font-semibold" style={{ color: "#1a1a1a" }}>
                    {auto.analytics.ctr}% CTR
                  </span>
                  <span>·</span>
                  <span>{auto.analytics.sent} sent</span>
                  <span>·</span>
                  <span>{auto.analytics.skipped} skipped</span>
                  <span>·</span>
                  <span>{auto.analytics.failed} failed</span>
                  <span>·</span>
                  <span>{auto.analytics.clicks} clicks</span>
                </div>

                {auto.analytics.topKeywords.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {auto.analytics.topKeywords.map((keyword) => (
                      <span
                        key={keyword.keyword}
                        className="rounded-full px-2.5 py-0.5 text-xs"
                        style={{
                          background: "#f0f0ec",
                          color: "#7a7a72",
                          border: "1px solid #e8e8e4",
                        }}
                      >
                        {keyword.keyword}: {keyword.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div
                className="ml-auto flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Copy reel URL */}
                {auto.postUrl && (
                  <button
                    onClick={() => void copyReelUrl(auto)}
                    className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      background: "#f0f0ec",
                      color: "#7a7a72",
                      border: "1px solid #e8e8e4",
                    }}
                  >
                    {copiedId === auto.id ? "Copied!" : "Copy URL"}
                  </button>
                )}
                {/* Toggle */}
                <button
                  onClick={() => toggleActive(auto.id, auto.isActive)}
                  className={`relative w-11 h-6 rounded-full transition-colors`}
                  style={{ background: auto.isActive ? "#6B9FE8" : "#d0d0ca" }}
                >
                  <span
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                    style={{ left: auto.isActive ? "1.5rem" : "0.25rem" }}
                  />
                </button>

                {/* Kebab menu */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setMenuOpenId((cur) => (cur === auto.id ? null : auto.id))
                    }
                    aria-label="More actions"
                    className="px-2 py-1 rounded-lg text-lg leading-none transition-colors"
                    style={{ color: "#a0a0a0" }}
                  >
                    ⋯
                  </button>
                  {menuOpenId === auto.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpenId(null)}
                      />
                      <div
                        className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-2xl shadow-xl"
                        style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
                      >
                        <button
                          onClick={() => void duplicateAutomation(auto)}
                          className="block w-full px-4 py-2.5 text-left text-sm transition-colors"
                          style={{ color: "#1a1a1a" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f7f7f5"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => {
                            setMenuOpenId(null);
                            void deleteAutomation(auto.id);
                          }}
                          className="block w-full px-4 py-2.5 text-left text-sm transition-colors"
                          style={{ color: "#dc2626" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Reel lightbox */}
      {playingVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPlayingVideo(null)}
        >
          <div
            className="relative flex max-w-full flex-col items-end gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 text-sm">
              {playingVideo.postUrl && (
                <a
                  href={playingVideo.postUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-300 hover:text-white"
                >
                  Open on Instagram
                </a>
              )}
              <button
                type="button"
                onClick={() => setPlayingVideo(null)}
                className="text-zinc-300 hover:text-white"
              >
                Close
              </button>
            </div>
            <video
              src={playingVideo.url}
              controls
              autoPlay
              loop
              playsInline
              className="max-h-[80vh] max-w-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
