/**
 * Status Badge for DM status — pill style matching Nudge design system.
 */

const statusConfig: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  SENT:               { label: "Sent",         bg: "#dcfce7", color: "#16a34a" },
  FAILED:             { label: "Failed",        bg: "#fee2e2", color: "#dc2626" },
  PENDING:            { label: "Pending",       bg: "#fef9c3", color: "#a16207" },
  SKIPPED_DEDUP:      { label: "Dedup",         bg: "#f0f0ec", color: "#7a7a72" },
  SKIPPED_RATE_LIMIT: { label: "Rate limited",  bg: "#fef9c3", color: "#a16207" },
  SKIPPED_PLAN_LIMIT: { label: "Skipped",       bg: "#f0f0ec", color: "#7a7a72" },
  SKIPPED_NO_MATCH:   { label: "No match",      bg: "#f0f0ec", color: "#7a7a72" },
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, bg: "#f0f0ec", color: "#7a7a72" };

  return (
    <span
      className="shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}
