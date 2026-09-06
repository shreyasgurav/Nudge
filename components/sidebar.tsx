"use client";

/**
 * Sidebar Navigation — Nudge
 *
 * Clean nav with Comfortaa branding, active state, and a user dropdown at the
 * bottom showing:
 *   - Signed-in email
 *   - Current + all other Instagram accounts with a checkmark on active
 *   - "+ Add Instagram account" CTA
 *   - Sign out
 */

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { InstagramAccountStub } from "@/components/dashboard-shell";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Inbox", href: "/inbox" },
  { label: "Campaigns", href: "/campaigns" },
  { label: "DM Logs", href: "/logs" },
  { label: "Settings", href: "/settings" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceName: string;
  userEmail: string | null;
  instagramAccounts: InstagramAccountStub[];
}

export default function Sidebar({
  isOpen,
  onClose,
  userEmail,
  instagramAccounts,
}: SidebarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // Track which Instagram account is "active" — default to the first one
  const [activeAccountId, setActiveAccountId] = useState<string | null>(
    instagramAccounts[0]?.id ?? null
  );
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = userEmail ? userEmail.split("@")[0] : "account";
  const activeAccount = instagramAccounts.find((a) => a.id === activeAccountId)
    ?? instagramAccounts[0]
    ?? null;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-dvh w-60 max-w-[85vw] shrink-0 flex flex-col
          transition-transform duration-200 ease-out
          lg:h-full lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ background: "#ffffff", borderRight: "1px solid #e8e8e4" }}
      >
        {/* Wordmark — height matches TopBar so border-bottom lines up */}
        <div
          className="flex items-center px-5 shrink-0"
          style={{
            height: "calc(3.75rem + env(safe-area-inset-top))",
            paddingTop: "env(safe-area-inset-top)",
            borderBottom: "1px solid #e8e8e4",
          }}
        >
          <Link
            href="/dashboard"
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
          >
            nudge
          </Link>
        </div>


        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className="block px-3 py-2.5 rounded-xl text-sm transition-colors"
                style={{
                  fontFamily: "'Comfortaa', sans-serif",
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? "#eeeeeb" : "transparent",
                  color: isActive ? "#1a1a1a" : "#7a7a72",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ── User + Account Dropdown ────────────────────────────── */}
        <div
          className="relative px-3 py-4"
          style={{ borderTop: "1px solid #e8e8e4" }}
          ref={menuRef}
        >
          {/* Floating dropdown panel — appears above the trigger, wider than sidebar */}
          {menuOpen && (
            <div
              className="absolute rounded-2xl overflow-hidden"
              style={{
                bottom: "calc(100% - 1rem)",
                left: "12px",
                width: "268px",
                background: "#ffffff",
                border: "1px solid #e8e8e4",
                boxShadow: "0 -8px 32px rgb(0 0 0 / 0.1), 0 0 0 1px #e8e8e4",
                zIndex: 10,
              }}
            >
              {/* Email */}
              <div
                className="px-4 py-3"
                style={{ borderBottom: "1px solid #f0f0ec" }}
              >
                <p className="text-xs mb-0.5" style={{ color: "#a0a0a0" }}>
                  Signed in as
                </p>
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: "#1a1a1a" }}
                >
                  {userEmail ?? displayName}
                </p>
              </div>

              {/* Instagram accounts */}
              {instagramAccounts.length > 0 && (
                <div style={{ borderBottom: "1px solid #f0f0ec" }}>
                  <p
                    className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "#a0a0a0", fontFamily: "'Comfortaa', sans-serif" }}
                  >
                    Instagram
                  </p>
                  {instagramAccounts.map((account) => {
                    const isActive = account.id === activeAccountId;
                    return (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => {
                          setActiveAccountId(account.id);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors"
                        style={{ color: isActive ? "#1a1a1a" : "#7a7a72" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "#f7f7f5";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        }}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          {/* Avatar circle */}
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                            style={{
                              background: isActive ? "#6B9FE8" : "#eeeeeb",
                              color: isActive ? "white" : "#7a7a72",
                            }}
                          >
                            {account.username[0].toUpperCase()}
                          </span>
                          <span className="truncate font-medium">
                            @{account.username}
                          </span>
                        </span>
                        {/* Checkmark for active */}
                        {isActive && (
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 15 15"
                            fill="none"
                            style={{ flexShrink: 0, color: "#6B9FE8" }}
                          >
                            <path
                              d="M2.5 7.5L6 11L12.5 4"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })}

                  {/* + Add Instagram account */}
                  <a
                    href="/api/instagram/connect"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                    style={{ color: "#6B9FE8" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "#f0f5ff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    }}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-lg font-light"
                      style={{ background: "#dbeafe", color: "#6B9FE8" }}
                    >
                      +
                    </span>
                    <span className="font-medium whitespace-nowrap">Add Instagram account</span>
                  </a>
                </div>
              )}

              {/* No accounts connected yet */}
              {instagramAccounts.length === 0 && (
                <div style={{ borderBottom: "1px solid #f0f0ec" }}>
                  <a
                    href="/api/instagram/connect"
                    className="flex items-center gap-2.5 px-4 py-3 text-sm transition-colors"
                    style={{ color: "#6B9FE8" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "#f0f5ff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    }}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-lg font-light"
                      style={{ background: "#dbeafe", color: "#6B9FE8" }}
                    >
                      +
                    </span>
                    <span className="font-medium">Connect Instagram</span>
                  </a>
                </div>
              )}

              {/* Sign out */}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-4 py-3 text-sm transition-colors"
                style={{ color: "#7a7a72" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#f7f7f5";
                  (e.currentTarget as HTMLButtonElement).style.color = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "#7a7a72";
                }}
              >
                Sign out
              </button>
            </div>
          )}

          {/* Trigger button */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors"
            style={{
              background: menuOpen ? "#eeeeeb" : "transparent",
              color: "#1a1a1a",
            }}
            onMouseEnter={(e) => {
              if (!menuOpen)
                (e.currentTarget as HTMLButtonElement).style.background = "#f5f5f3";
            }}
            onMouseLeave={(e) => {
              if (!menuOpen)
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            {/* Avatar / initials */}
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              style={{ background: "#6B9FE8", color: "white" }}
            >
              {displayName[0].toUpperCase()}
            </span>

            <span className="flex-1 min-w-0 text-left">
              <span
                className="block text-sm font-semibold truncate leading-tight"
                style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
              >
                {displayName}
              </span>
              {activeAccount && (
                <span
                  className="block text-xs truncate leading-tight mt-0.5"
                  style={{ color: "#7a7a72" }}
                >
                  @{activeAccount.username}
                </span>
              )}
            </span>

            {/* Chevron */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              style={{
                flexShrink: 0,
                color: "#a0a0a0",
                transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            >
              <path
                d="M2.5 5L7 9.5L11.5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
