"use client";

/**
 * Followers Over Time
 *
 * Single-series line chart over stored daily snapshots. Deliberately separate
 * from the Overview stat tiles: those sum the selected posts, while this is an
 * account-level total that ignores the post range.
 *
 * History depth is limited by what has been snapshotted — Instagram only serves
 * ~30 days of account insights, so earlier days exist only if this instance was
 * already running then.
 */

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface FollowerChartPoint {
  date: string;
  followers: number;
  delta: number | null;
}

// Nudge accent blue for the line — clear contrast against white chart surface.
const SERIES_COLOR = "#6B9FE8";
const GRID_COLOR = "#e8e8e4";
const AXIS_TEXT = "#a0a0a0";

function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatSigned(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toLocaleString()}`;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: FollowerChartPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
    >
      <p className="text-xs" style={{ color: "#7a7a72" }}>{formatDay(point.date)}</p>
      <p className="mt-1 font-semibold text-sm" style={{ color: "#1a1a1a" }}>
        {point.followers.toLocaleString()} followers
      </p>
      {point.delta !== null && point.delta !== 0 && (
        <p
          className="text-xs mt-0.5"
          style={{ color: point.delta > 0 ? "#16a34a" : "#dc2626" }}
        >
          {formatSigned(point.delta)} that day
        </p>
      )}
    </div>
  );
}

export default function FollowerChart({
  data,
  followers,
}: {
  data: FollowerChartPoint[];
  followers: number | null;
}) {
  const [showTable, setShowTable] = useState(false);

  const current = followers ?? data.at(-1)?.followers ?? null;

  // Net change across the whole visible window, shown once in the header rather
  // than labelling every point.
  const net =
    data.length > 1 ? data[data.length - 1].followers - data[0].followers : null;

  return (
    <div
      className="rounded-2xl p-4 sm:p-6"
      style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            className="text-sm font-bold"
            style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
          >
            Followers over time
          </h2>
          <p className="mt-1 text-sm" style={{ color: "#7a7a72" }}>
            {current === null
              ? "Follower count unavailable"
              : `${current.toLocaleString()} now`}
            {net !== null && (
              <>
                {" · "}
                <span style={{ color: net >= 0 ? "#16a34a" : "#dc2626" }}>
                  {formatSigned(net)}
                </span>{" "}
                over {data.length} days
              </>
            )}
          </p>
        </div>
        {data.length > 1 && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all"
            style={{
              background: "#f0f0ec",
              color: "#7a7a72",
              border: "1px solid #e8e8e4",
            }}
          >
            {showTable ? "Show chart" : "Show table"}
          </button>
        )}
      </div>

      {data.length < 2 ? (
        <div
          className="mt-5 rounded-xl p-6 text-center"
          style={{ background: "#f7f7f5" }}
        >
          <p
            className="text-sm font-semibold"
            style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
          >
            Collecting follower history
          </p>
          <p className="mt-1 text-sm" style={{ color: "#7a7a72" }}>
            {data.length === 0
              ? "No snapshots recorded yet."
              : "One day recorded so far."}{" "}
            A point is added daily — the chart appears once there are at least
            two.
          </p>
        </div>
      ) : showTable ? (
        <div className="mt-4 max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs uppercase tracking-wide"
                style={{ borderBottom: "1px solid #e8e8e4", color: "#a0a0a0" }}
              >
                <th className="py-2 pr-4 font-semibold" style={{ fontFamily: "'Comfortaa', sans-serif" }}>Date</th>
                <th className="py-2 px-3 font-semibold text-right" style={{ fontFamily: "'Comfortaa', sans-serif" }}>Followers</th>
                <th className="py-2 pl-3 font-semibold text-right" style={{ fontFamily: "'Comfortaa', sans-serif" }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((p) => (
                <tr key={p.date} style={{ borderBottom: "1px solid #f0f0ec" }}>
                  <td className="py-2 pr-4" style={{ color: "#1a1a1a" }}>
                    {formatDay(p.date)}
                  </td>
                  <td className="py-2 px-3 text-right" style={{ color: "#7a7a72" }}>
                    {p.followers.toLocaleString()}
                  </td>
                  <td className="py-2 pl-3 text-right" style={{ color: "#7a7a72" }}>
                    {p.delta === null ? "—" : formatSigned(p.delta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke={GRID_COLOR}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDay}
                tick={{ fill: AXIS_TEXT, fontSize: 12 }}
                stroke={GRID_COLOR}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                tickFormatter={formatCompact}
                tick={{ fill: AXIS_TEXT, fontSize: 12 }}
                stroke={GRID_COLOR}
                tickLine={false}
                width={52}
                // Followers rarely start near zero, so a zero baseline would
                // flatten the line into a straight edge.
                domain={["dataMin - 5", "dataMax + 5"]}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: GRID_COLOR, strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="followers"
                stroke={SERIES_COLOR}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: SERIES_COLOR, stroke: "#ffffff", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
