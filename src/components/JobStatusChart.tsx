import type { ApplicationStatus } from "@/lib/types";

const STAGES: { status: ApplicationStatus; label: string; color: string }[] = [
  { status: "matched", label: "Matched", color: "#ec4899" },
  { status: "applied", label: "Applied", color: "#3b82f6" },
  { status: "interviewing", label: "Interviewing", color: "#d97706" },
  { status: "offer", label: "Offer", color: "#059669" },
  { status: "rejected", label: "Rejected", color: "#7c3aed" },
];

export default function JobStatusChart({
  statuses,
}: {
  statuses: ApplicationStatus[];
}) {
  const counts = STAGES.map(({ status }) => {
    return statuses.filter((s) => (s ?? "matched") === status).length;
  });
  const max = Math.max(1, ...counts);
  const total = statuses.length;

  return (
    <div className="mb-5 rounded-2xl bg-neutral-900 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        Total applications
      </p>
      <p className="mb-4 text-3xl font-bold">{total}</p>

      <div className="flex flex-col gap-2.5">
        {STAGES.map(({ status, label, color }, i) => {
          const count = counts[i];
          const widthPct = total === 0 ? 0 : (count / max) * 100;
          return (
            <div key={status} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-neutral-400">
                {label}
              </span>
              <div className="h-6 min-w-0 flex-1 overflow-hidden rounded bg-neutral-800">
                <div
                  className="flex h-full items-center justify-end rounded-r px-2 transition-all"
                  style={{
                    width: `${Math.max(widthPct, count > 0 ? 10 : 0)}%`,
                    backgroundColor: color,
                  }}
                >
                  {count > 0 && (
                    <span className="text-xs font-semibold text-white">
                      {count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
