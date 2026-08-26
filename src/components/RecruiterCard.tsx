import { Briefcase, Sparkles } from "lucide-react";
import type { Recruiter } from "@/lib/types";

export default function RecruiterCard({ recruiter }: { recruiter: Recruiter }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl bg-neutral-900 shadow-2xl">
      <div
        className="flex h-2/5 flex-shrink-0 flex-col items-center justify-center gap-2"
        style={{
          background: `linear-gradient(135deg, ${recruiter.color}, #0a0a0a)`,
        }}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-2xl font-bold text-white ring-4 ring-white/20">
          {recruiter.initials}
        </div>
        <h2 className="text-xl font-bold text-white">{recruiter.name}</h2>
        <p className="text-sm text-white/80">
          {recruiter.title} @ {recruiter.company}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
        <p className="flex items-center gap-2 text-sm text-neutral-400">
          <Briefcase size={15} className="text-pink-500" />
          Recruits for {recruiter.company}
        </p>

        <p className="text-sm leading-relaxed text-neutral-400">
          {recruiter.bio}
        </p>

        <div className="mt-auto">
          <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <Sparkles size={13} className="text-pink-500" />
            Hiring for
          </p>
          <div className="flex flex-wrap gap-2">
            {recruiter.specialties.map((s) => (
              <span
                key={s}
                className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
