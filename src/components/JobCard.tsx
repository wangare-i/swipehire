import { MapPin, Wallet, Clock } from "lucide-react";
import type { Job } from "@/lib/types";

export default function JobCard({ job }: { job: Job }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl bg-neutral-900 shadow-2xl">
      <div
        className="flex h-2/5 flex-shrink-0 flex-col justify-end p-6"
        style={{
          background: `linear-gradient(135deg, ${job.color}, #0a0a0a)`,
        }}
      >
        <p className="text-sm font-medium text-white/80">{job.company}</p>
        <h2 className="text-2xl font-bold text-white">{job.title}</h2>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
        <div className="flex flex-wrap gap-3 text-sm text-neutral-300">
          <span className="flex items-center gap-1">
            <MapPin size={15} className="text-pink-500" />
            {job.location}
            {job.remote ? " · Remote" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Wallet size={15} className="text-pink-500" />
            {job.salary}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={15} className="text-pink-500" />
            {job.postedAt}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-neutral-400">
          {job.description}
        </p>

        <div className="mt-auto flex flex-wrap gap-2">
          {job.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
