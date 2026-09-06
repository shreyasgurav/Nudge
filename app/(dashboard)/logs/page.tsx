"use client";

/**
 * DM Logs Page
 *
 * Filterable, paginated table of DM logs.
 */

import { useEffect, useState, useCallback } from "react";
import AccountSelect, { type AccountOption } from "@/components/account-select";
import StatusBadge from "@/components/status-badge";

interface DmLog {
  id: string;
  commenterId: string;
  commenterName: string | null;
  commentText: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  automation: { name: string; keywords: string[] };
  instagramAccount: { username: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_FILTERS = [
  { key: "ALL",                label: "All" },
  { key: "SENT",               label: "Sent" },
  { key: "FAILED",             label: "Failed" },
  { key: "PENDING",            label: "Pending" },
  { key: "SKIPPED_RATE_LIMIT", label: "Rate limited" },
  { key: "SKIPPED_PLAN_LIMIT", label: "Skipped" },
  { key: "SKIPPED_DEDUP",      label: "Dedup" },
];

export default function LogsPage() {
  const [logs, setLogs] = useState<DmLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (selectedAccountId !== "all") {
        params.set("instagramAccountId", selectedAccountId);
      }
      const res = await fetch(`/api/logs?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, selectedAccountId]);

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
      void fetchLogs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchLogs]);

  function handleFilterChange(status: string) {
    setLoading(true);
    setStatusFilter(status);
    setPage(1);
  }

  function handleAccountChange(accountId: string) {
    setLoading(true);
    setSelectedAccountId(accountId);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status pills */}
        <div
          className="inline-flex flex-wrap gap-1 rounded-full p-1"
          style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
        >
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleFilterChange(key)}
              className="rounded-full px-4 py-1.5 text-sm transition-all"
              style={{
                background: statusFilter === key ? "#6B9FE8" : "transparent",
                color: statusFilter === key ? "white" : "#7a7a72",
                fontWeight: statusFilter === key ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {accounts.length > 1 && (
          <AccountSelect
            accounts={accounts}
            value={selectedAccountId}
            onChange={handleAccountChange}
          />
        )}
      </div>

      {/* Table card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
      >
        {/* Horizontal scroll wrapper — keeps table at min-width on mobile */}
        <div className="-mx-0 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr
                className="text-left text-xs uppercase tracking-wide"
                style={{ borderBottom: "1px solid #e8e8e4", color: "#a0a0a0" }}
              >
                <th
                  className="px-5 py-3.5 font-semibold"
                  style={{ fontFamily: "'Comfortaa', sans-serif" }}
                >
                  Commenter
                </th>
                <th
                  className="px-5 py-3.5 font-semibold"
                  style={{ fontFamily: "'Comfortaa', sans-serif" }}
                >
                  Comment
                </th>
                <th
                  className="px-5 py-3.5 font-semibold"
                  style={{ fontFamily: "'Comfortaa', sans-serif" }}
                >
                  Campaign
                </th>
                <th
                  className="px-5 py-3.5 font-semibold"
                  style={{ fontFamily: "'Comfortaa', sans-serif" }}
                >
                  Account
                </th>
                <th
                  className="px-5 py-3.5 font-semibold"
                  style={{ fontFamily: "'Comfortaa', sans-serif" }}
                >
                  Status
                </th>
                <th
                  className="px-5 py-3.5 font-semibold"
                  style={{ fontFamily: "'Comfortaa', sans-serif" }}
                >
                  Time
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Loading skeletons */}
              {loading &&
                [...Array(8)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f0ec" }}>
                    {[...Array(6)].map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div
                          className="h-3 rounded-full animate-pulse"
                          style={{
                            background: "#eeeeeb",
                            width: j === 1 ? "120px" : j === 4 ? "60px" : "80px",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

              {/* Empty state */}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <p className="text-sm" style={{ color: "#a0a0a0" }}>
                      No logs found
                    </p>
                  </td>
                </tr>
              )}

              {/* Rows */}
              {!loading &&
                logs.map((log) => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: "1px solid #f0f0ec" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = "#f7f7f5";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                    }}
                  >
                    {/* Commenter */}
                    <td className="px-5 py-3.5">
                      <span
                        className="font-semibold"
                        style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
                      >
                        @{log.commenterName ?? log.commenterId.slice(0, 8)}
                      </span>
                    </td>

                    {/* Comment */}
                    <td className="px-5 py-3.5 max-w-[200px]">
                      <span
                        className="truncate block text-sm"
                        style={{ color: "#7a7a72" }}
                      >
                        {log.commentText}
                      </span>
                    </td>

                    {/* Campaign */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm" style={{ color: "#7a7a72" }}>
                        {log.automation.name}
                      </span>
                    </td>

                    {/* Account */}
                    <td className="px-5 py-3.5">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          background: "#f0f0ec",
                          color: "#7a7a72",
                          border: "1px solid #e8e8e4",
                        }}
                      >
                        @{log.instagramAccount.username}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={log.status} />
                      {log.errorMessage && (
                        <p
                          className="mt-1 text-xs truncate max-w-[160px]"
                          style={{ color: "#dc2626" }}
                          title={log.errorMessage}
                        >
                          {log.errorMessage}
                        </p>
                      )}
                    </td>

                    {/* Time */}
                    <td
                      className="px-5 py-3.5 whitespace-nowrap text-sm"
                      style={{ color: "#a0a0a0" }}
                    >
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            style={{ borderTop: "1px solid #e8e8e4" }}
          >
            <p className="text-xs" style={{ color: "#a0a0a0" }}>
              Showing{" "}
              {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  setPage(page - 1);
                }}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-all disabled:opacity-30 disabled:pointer-events-none"
                style={{
                  background: "#f0f0ec",
                  color: "#7a7a72",
                  border: "1px solid #e8e8e4",
                }}
              >
                ← Prev
              </button>
              <span className="text-xs px-2" style={{ color: "#7a7a72" }}>
                {page} / {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => {
                  setLoading(true);
                  setPage(page + 1);
                }}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-all disabled:opacity-30 disabled:pointer-events-none"
                style={{
                  background: "#6B9FE8",
                  color: "white",
                  boxShadow: "0 2px 8px rgb(107 159 232 / 0.3)",
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
