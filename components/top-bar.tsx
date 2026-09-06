"use client";

/**
 * Top Bar
 *
 * Page title, mobile hamburger, and connection status.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { readCache, writeCache } from "@/lib/client-cache";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/campaigns": "Campaigns",
  "/campaigns/new": "New Campaign",
  "/automations": "Campaigns",
  "/automations/new": "New Campaign",
  "/logs": "DM Logs",
  "/inbox": "Inbox",
  "/overview": "Overview",
  "/settings": "Settings",
  "/diagnostics": "Diagnostics",
};

interface TopBarProps {
  onMenuClick: () => void;
  instagramAccountId?: string | null;
  instagramUsername: string | null;
  instagramAccountCount: number;
}

export default function TopBar({
  onMenuClick,
  instagramAccountId,
  instagramUsername,
  instagramAccountCount,
}: TopBarProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Dashboard";

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!instagramAccountId) return;
    let cancelled = false;
    const cacheKey = `ig-avatar:${instagramAccountId}`;
    const cached = readCache<string | null>(cacheKey, 30 * 60 * 1000);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cached.data !== null) setAvatarUrl(cached.data);

    const params = new URLSearchParams({ instagramAccountId });
    fetch(`/api/instagram/profile?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const url = d.success ? d.data.profilePictureUrl ?? null : null;
        setAvatarUrl(url);
        writeCache(cacheKey, url);
      })
      .catch(() => {
        if (!cancelled && cached.data === null) setAvatarUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [instagramAccountId]);

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-3 px-5 lg:px-8"
      style={{
        height: "calc(3.75rem + env(safe-area-inset-top))",
        paddingTop: "env(safe-area-inset-top)",
        background: "#f7f7f5",
        borderBottom: "1px solid #e8e8e4",
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden shrink-0 px-2.5 py-1.5 rounded-lg text-sm transition-colors"
          style={{ color: "#7a7a72", background: "#eeeeeb" }}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <h1
          className="truncate text-base sm:text-lg"
          style={{ fontFamily: "'Comfortaa', sans-serif", fontWeight: 700, color: "#1a1a1a" }}
        >
          {title}
        </h1>
      </div>

      {instagramAccountCount > 0 ? (
        <div className="flex shrink-0 items-center gap-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-7 w-7 shrink-0 rounded-full object-cover shadow-sm border border-[#e8e8e4]"
            />
          ) : (
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
              style={{ background: "#6B9FE8" }}
            >
              {instagramUsername ? instagramUsername.charAt(0).toUpperCase() : "I"}
            </div>
          )}
          <span
            className="truncate text-sm font-semibold tracking-wide"
            style={{ color: "#1a1a1a" }}
          >
            {instagramAccountCount > 1
              ? `${instagramAccountCount} accounts`
              : `${instagramUsername}`}
          </span>
        </div>
      ) : (
        <a
          href="/api/instagram/connect"
          className="shrink-0 whitespace-nowrap text-sm font-semibold px-4 py-2 rounded-full transition-all"
          style={{
            background: "#6B9FE8",
            color: "white",
            boxShadow: "0 2px 8px rgb(107 159 232 / 0.3)",
          }}
        >
          <span className="sm:hidden">Connect</span>
          <span className="hidden sm:inline">Connect Instagram</span>
        </a>
      )}
    </header>
  );
}
