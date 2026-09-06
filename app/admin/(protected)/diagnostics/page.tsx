"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/status-badge";

interface DiagnosticsData {
  queueCounts: Record<string, number>;
  workerHealth: {
    healthy: boolean;
    ageMs: number | null;
    heartbeat: {
      checkedAt: string;
      hostname?: string;
      pid: number;
      startedAt?: string;
    } | null;
  };
  workerAlerts: Array<{
    level: string;
    message: string;
    jobId?: string;
    commentId?: string;
    createdAt: string;
  }>;
  webhookFailures: Array<{
    id: string;
    object: string | null;
    errorMessage: string | null;
    createdAt: string;
  }>;
  dmFailures: Array<{
    id: string;
    status: string;
    commentId: string;
    commentText: string;
    errorMessage: string | null;
    updatedAt: string;
    automation: { name: string };
  }>;
  tokenRefreshFailures: Array<{
    id: string;
    message: string;
    createdAt: string;
  }>;
  operationalEvents: Array<{
    id: string;
    source: string;
    level: string;
    message: string;
    createdAt: string;
    resolvedAt: string | null;
  }>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm" style={{ color: "#a0a0a0" }}>
        {label}
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
    >
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #e8e8e4" }}>
        <h2
          className="text-sm font-bold"
          style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
        >
          {title}
        </h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export default function AdminDiagnosticsPage() {
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshDiagnostics() {
    setLoading(true);
    const response = await fetch("/api/admin/diagnostics");
    const payload = await response.json();
    if (payload.success) setData(payload.data);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      const response = await fetch("/api/admin/diagnostics");
      const payload = await response.json();
      if (active && payload.success) setData(payload.data);
      if (active) setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl h-36 animate-pulse"
            style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
          />
        ))}
      </div>
    );
  }

  const workerAgeSeconds =
    data?.workerHealth.ageMs == null
      ? null
      : Math.round(data.workerHealth.ageMs / 1000);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
          >
            Diagnostics
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#7a7a72" }}>
            Health, queues, webhook failures, and worker alerts across all
            workspaces.
          </p>
        </div>
        <button
          onClick={() => void refreshDiagnostics()}
          className="cursor-pointer self-start rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
          style={{
            background: "#ffffff",
            color: "#1a1a1a",
            border: "1px solid #e8e8e4",
            boxShadow: "0 1px 4px rgb(0 0 0 / 0.06)",
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        <div
          className="rounded-2xl p-4 sm:p-5 col-span-2 md:col-span-1"
          style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ fontFamily: "'Comfortaa', sans-serif", color: "#a0a0a0" }}
          >
            Worker
          </p>
          <p
            className="mt-3 text-xl font-bold"
            style={{
              fontFamily: "'Comfortaa', sans-serif",
              color: data?.workerHealth.healthy ? "#16a34a" : "#d97706",
            }}
          >
            {data?.workerHealth.healthy ? "Healthy" : "Attention"}
          </p>
          <p className="mt-1 text-xs" style={{ color: "#a0a0a0" }}>
            {workerAgeSeconds == null
              ? "No heartbeat"
              : `Heartbeat ${workerAgeSeconds}s ago`}
          </p>
        </div>

        {["waiting", "active", "delayed", "failed"].map((key) => (
          <div
            key={key}
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide capitalize"
              style={{ fontFamily: "'Comfortaa', sans-serif", color: "#a0a0a0" }}
            >
              {key}
            </p>
            <p
              className="mt-3 text-2xl font-bold"
              style={{
                fontFamily: "'Comfortaa', sans-serif",
                color:
                  key === "failed" && (data?.queueCounts[key] ?? 0) > 0
                    ? "#dc2626"
                    : "#1a1a1a",
              }}
            >
              {data?.queueCounts[key] ?? 0}
            </p>
          </div>
        ))}
      </div>

      {/* Worker Alerts */}
      <Section title="Recent Worker Alerts">
        {data?.workerAlerts.length ? (
          <div className="space-y-2">
            {data.workerAlerts.map((alert) => (
              <div
                key={`${alert.createdAt}-${alert.jobId ?? alert.message}`}
                className="rounded-2xl p-4"
                style={{ background: "#f7f7f5" }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 break-words text-sm font-semibold" style={{ color: "#1a1a1a" }}>
                    {alert.message}
                  </p>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ background: "#fee2e2", color: "#dc2626" }}
                  >
                    {alert.level}
                  </span>
                </div>
                <p className="mt-1.5 text-xs" style={{ color: "#a0a0a0" }}>
                  {formatDate(alert.createdAt)}
                  {alert.commentId ? ` · ${alert.commentId}` : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState label="No worker alerts recorded." />
        )}
      </Section>

      {/* DM + Webhook failures */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Campaign DM Failures & Skips">
          {data?.dmFailures.length ? (
            <div className="space-y-0">
              {data.dmFailures.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5"
                  style={{ borderBottom: "1px solid #f0f0ec" }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold" style={{ color: "#1a1a1a" }}>
                      {item.automation.name}
                    </p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 truncate text-xs" style={{ color: "#7a7a72" }}>
                    {item.commentText}
                  </p>
                  {item.errorMessage && (
                    <p className="mt-0.5 text-xs" style={{ color: "#dc2626" }}>
                      {item.errorMessage}
                    </p>
                  )}
                  <p className="mt-1 text-xs" style={{ color: "#a0a0a0" }}>
                    {formatDate(item.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="No DM failures or skips." />
          )}
        </Section>

        <Section title="Webhook Failures">
          {data?.webhookFailures.length ? (
            <div className="space-y-0">
              {data.webhookFailures.map((event) => (
                <div
                  key={event.id}
                  className="py-3.5"
                  style={{ borderBottom: "1px solid #f0f0ec" }}
                >
                  <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>
                    {event.object ?? "Instagram webhook"}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "#dc2626" }}>
                    {event.errorMessage ?? "Unknown error"}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "#a0a0a0" }}>
                    {formatDate(event.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="No failed webhook events." />
          )}
        </Section>
      </div>

      {/* Token Refresh Failures */}
      <Section title="Token Refresh Failures">
        {data?.tokenRefreshFailures.length ? (
          <div className="space-y-0">
            {data.tokenRefreshFailures.map((event) => (
              <div
                key={event.id}
                className="py-3.5"
                style={{ borderBottom: "1px solid #f0f0ec" }}
              >
                <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>
                  {event.message}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "#a0a0a0" }}>
                  {formatDate(event.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState label="No token refresh failures." />
        )}
      </Section>

      {/* Operational Event Timeline */}
      <Section title="Operational Event Timeline">
        {data?.operationalEvents.length ? (
          <div className="space-y-0">
            {data.operationalEvents.map((event) => (
              <div
                key={event.id}
                className="grid gap-1 py-3.5 sm:grid-cols-[120px_1fr_auto]"
                style={{ borderBottom: "1px solid #f0f0ec" }}
              >
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold self-start"
                  style={{ background: "#f0f0ec", color: "#7a7a72", width: "fit-content" }}
                >
                  {event.source}
                </span>
                <p className="text-sm" style={{ color: "#1a1a1a" }}>
                  {event.message}
                </p>
                <p className="text-xs whitespace-nowrap" style={{ color: "#a0a0a0" }}>
                  {formatDate(event.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState label="No operational events recorded." />
        )}
      </Section>
    </div>
  );
}
