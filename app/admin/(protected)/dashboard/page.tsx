import StatCard from "@/components/stat-card";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDate(value: Date): string {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminDashboardPage() {
  const [
    workspaceCount,
    userCount,
    instagramCount,
    dmSent,
    dmFailed,
    dmSkipped,
    workspaces,
  ] = await Promise.all([
    prisma.workspace.count(),
    prisma.user.count(),
    prisma.instagramAccount.count(),
    prisma.dmLog.count({ where: { status: "SENT" } }),
    prisma.dmLog.count({ where: { status: "FAILED" } }),
    prisma.dmLog.count({
      where: {
        status: {
          in: [
            "SKIPPED_RATE_LIMIT",
            "SKIPPED_PLAN_LIMIT",
            "SKIPPED_NO_MATCH",
            "SKIPPED_DEDUP",
          ],
        },
      },
    }),
    prisma.workspace.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        createdAt: true,
        dmsSentThisPeriod: true,
        owner: { select: { email: true } },
        _count: {
          select: {
            members: true,
            instagramAccounts: true,
            automations: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
        >
          Platform Overview
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#7a7a72" }}>
          Aggregate metrics across every workspace on this instance.
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard label="Workspaces" value={formatNumber(workspaceCount)} />
        <StatCard label="Users" value={formatNumber(userCount)} />
        <StatCard label="IG Accounts" value={formatNumber(instagramCount)} />
        <StatCard label="DMs Sent" value={formatNumber(dmSent)} />
        <StatCard label="DMs Failed" value={formatNumber(dmFailed)} />
        <StatCard label="DMs Skipped" value={formatNumber(dmSkipped)} />
      </div>

      {/* Workspaces table */}
      <div
        className="rounded-2xl p-4 sm:p-6"
        style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
      >
        <h2
          className="text-sm font-bold mb-5"
          style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
        >
          Workspaces ({workspaceCount})
        </h2>

        {workspaces.length === 0 ? (
          <div
            className="rounded-xl py-10 text-center"
            style={{ background: "#f7f7f5" }}
          >
            <p className="text-sm" style={{ color: "#a0a0a0" }}>
              No workspaces yet
            </p>
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr
                  className="text-left text-xs uppercase tracking-wide"
                  style={{ borderBottom: "1px solid #e8e8e4", color: "#a0a0a0" }}
                >
                  <th className="py-2 pr-4 font-semibold" style={{ fontFamily: "'Comfortaa', sans-serif" }}>Workspace</th>
                  <th className="py-2 px-3 font-semibold" style={{ fontFamily: "'Comfortaa', sans-serif" }}>Owner</th>
                  <th className="py-2 px-3 font-semibold text-right" style={{ fontFamily: "'Comfortaa', sans-serif" }}>Members</th>
                  <th className="py-2 px-3 font-semibold text-right" style={{ fontFamily: "'Comfortaa', sans-serif" }}>IG</th>
                  <th className="py-2 px-3 font-semibold text-right" style={{ fontFamily: "'Comfortaa', sans-serif" }}>Campaigns</th>
                  <th className="py-2 px-3 font-semibold text-right" style={{ fontFamily: "'Comfortaa', sans-serif" }}>DMs (period)</th>
                  <th className="py-2 pl-3 font-semibold text-right" style={{ fontFamily: "'Comfortaa', sans-serif" }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.map((ws) => (
                  <tr key={ws.id} style={{ borderBottom: "1px solid #f0f0ec" }}>
                    <td className="py-3 pr-4 max-w-xs">
                      <span className="truncate block font-semibold" style={{ color: "#1a1a1a" }}>
                        {ws.name}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <span className="truncate block" style={{ color: "#7a7a72" }}>
                        {ws.owner?.email ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right" style={{ color: "#7a7a72" }}>{ws._count.members}</td>
                    <td className="py-3 px-3 text-right" style={{ color: "#7a7a72" }}>{ws._count.instagramAccounts}</td>
                    <td className="py-3 px-3 text-right" style={{ color: "#7a7a72" }}>{ws._count.automations}</td>
                    <td className="py-3 px-3 text-right" style={{ color: "#7a7a72" }}>{ws.dmsSentThisPeriod}</td>
                    <td className="py-3 pl-3 text-right" style={{ color: "#a0a0a0" }}>{formatDate(ws.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
