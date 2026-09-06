/**
 * Stat Card
 *
 * Metric panel with label, value, and optional trend.
 */

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}

export default function StatCard({ label, value, trend, trendUp }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "#ffffff", border: "1px solid #e8e8e4" }}
    >
      <p
        className="text-xs font-medium mb-2"
        style={{ color: "#a0a0a0", fontFamily: "'Comfortaa', sans-serif" }}
      >
        {label}
      </p>
      <p
        className="text-2xl font-bold"
        style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
      >
        {value}
      </p>
      {trend && (
        <p
          className="text-xs mt-1 font-medium"
          style={{ color: trendUp ? "#16a34a" : "#dc2626" }}
        >
          {trendUp ? "↑" : "↓"} {trend}
        </p>
      )}
    </div>
  );
}
