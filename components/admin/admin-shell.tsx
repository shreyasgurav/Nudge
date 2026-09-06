"use client";

/**
 * Admin Shell
 *
 * Sidebar + top bar for the internal admin panel. Kept deliberately separate
 * from the creator dashboard shell so the two never share navigation or
 * branding. Sign out posts to the logoutAdmin server action.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/app/admin/login/actions";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Diagnostics", href: "/admin/diagnostics" },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: "#FFF5F0" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-dvh w-60 max-w-[85vw] shrink-0 flex flex-col
          transition-transform duration-200 ease-out
          lg:h-full lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ background: "#ffffff", borderRight: "1px solid #e8e8e4" }}
      >
        {/* Wordmark */}
        <div
          className="flex items-center px-5 shrink-0"
          style={{
            height: "calc(3.75rem + env(safe-area-inset-top))",
            paddingTop: "env(safe-area-inset-top)",
            borderBottom: "1px solid #e8e8e4",
          }}
        >
          <span
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
          >
            nudge <span style={{ color: "#6B9FE8" }}>admin</span>
          </span>
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
                onClick={() => setSidebarOpen(false)}
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

        {/* Sign out */}
        <div className="px-3 py-4" style={{ borderTop: "1px solid #e8e8e4" }}>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
              style={{ color: "#7a7a72", fontFamily: "'Comfortaa', sans-serif" }}
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
          </form>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 lg:px-8"
          style={{
            height: "calc(3.75rem + env(safe-area-inset-top))",
            paddingTop: "env(safe-area-inset-top)",
            background: "#FFF5F0",
            borderBottom: "1px solid #e8e8e4",
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden shrink-0 px-2.5 py-1.5 rounded-lg text-sm cursor-pointer"
              style={{ border: "1px solid #e8e8e4", color: "#7a7a72" }}
              aria-label="Open sidebar"
            >
              Menu
            </button>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: "#eef2ff", color: "#4f46e5" }}
            >
              Internal · Admin only
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-4 lg:px-8 py-5 sm:py-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
