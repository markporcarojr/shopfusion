"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { JobStatusSelect } from "./JobStatusSelect";
import { JobActions } from "./JobActions";
import {
  ChevronDown,
  ChevronRight,
  Search,
  ArrowUpDown,
  Box,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

type Job = {
  id: number;
  jobNumber: number | null;
  customerName: string;
  description: string | null;
  status: string;
  createdAt: Date;
  timeEntries: { hours: number }[];
  components: { id: number; name: string; material: string | null }[];
};

function statusColor(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "PAUSED":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "DONE":
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    default:
      return "";
  }
}

type SortField = "customer" | "jobNumber" | "status" | "date";

export function JobsList({ jobs }: { jobs: Job[] }) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return jobs
      .filter(
        (j) =>
          j.customerName.toLowerCase().includes(q) ||
          String(j.jobNumber ?? "").includes(q) ||
          j.description?.toLowerCase().includes(q) ||
          j.components.some((c) => c.name.toLowerCase().includes(q)),
      )
      .sort((a, b) => {
        let val = 0;
        if (sortField === "customer")
          val = a.customerName.localeCompare(b.customerName);
        if (sortField === "jobNumber")
          val = (a.jobNumber ?? 0) - (b.jobNumber ?? 0);
        if (sortField === "status") val = a.status.localeCompare(b.status);
        if (sortField === "date")
          val =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sortDir === "asc" ? val : -val;
      });
  }, [jobs, search, sortField, sortDir]);

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer, job number, component..."
          className="pl-9"
        />
      </div>

      {/* Sort bar */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="mr-2">Sort:</span>
        {(["customer", "jobNumber", "status", "date"] as SortField[]).map(
          (f) => (
            <button
              key={f}
              onClick={() => toggleSort(f)}
              className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                sortField === f
                  ? "border-orange-500 text-orange-500"
                  : "border-border hover:border-zinc-500"
              }`}
            >
              {f === "jobNumber"
                ? "Job #"
                : f.charAt(0).toUpperCase() + f.slice(1)}
              {sortField === f && <ArrowUpDown className="w-3 h-3" />}
            </button>
          ),
        )}
        <span className="ml-auto">{filtered.length} jobs</span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          No jobs match your search
        </div>
      ) : (
        <div className="border border-border rounded overflow-hidden">
          {filtered.map((job, i) => {
            const isExpanded = expanded.has(job.id);
            const totalHours = job.timeEntries.reduce(
              (acc, e) => acc + e.hours,
              0,
            );

            return (
              <div
                key={job.id}
                className={i !== 0 ? "border-t border-border" : ""}
              >
                {/* Row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => toggleExpand(job.id)}
                >
                  {/* Expand icon */}
                  <span className="text-muted-foreground w-4 shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>

                  {/* Job number */}
                  <span className="text-xs font-mono text-muted-foreground w-20 shrink-0">
                    {job.jobNumber ? `#${job.jobNumber}` : "—"}
                  </span>

                  {/* Customer */}
                  <span className="text-sm font-medium flex-1 truncate">
                    {job.customerName}
                  </span>

                  {/* Stats */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Box className="w-3.5 h-3.5" />
                      {job.components.length}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-orange-500 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {totalHours.toFixed(1)}h
                    </span>
                    <Badge
                      className={statusColor(job.status)}
                      variant="outline"
                    >
                      {job.status}
                    </Badge>
                    <div onClick={(e) => e.stopPropagation()}>
                      <JobStatusSelect
                        jobId={job.id}
                        currentStatus={job.status}
                      />
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <JobActions job={job} />
                    </div>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="px-11 pb-3 space-y-2 bg-accent/20">
                    {job.description && (
                      <p className="text-xs text-muted-foreground">
                        {job.description}
                      </p>
                    )}
                    {job.components.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.components.map((comp) => (
                          <Link
                            key={comp.id}
                            href={`/jobs/${job.id}/${comp.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs border border-border px-2 py-1 rounded hover:border-orange-500 hover:text-orange-500 transition-colors"
                          >
                            <Box className="w-3 h-3" />
                            {comp.name}
                            {comp.material && (
                              <span className="text-muted-foreground">
                                · {comp.material}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                    <Link
                      href={`/jobs/${job.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-orange-500 hover:underline"
                    >
                      View full job →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
