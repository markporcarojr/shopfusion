"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown, Box, FileImage, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";

type FusionLog = {
  id: number;
  type: string;
  modelName: string;
  boundingX: number;
  boundingY: number;
  boundingZ: number;
  bodies: number;
  components: string;
  notes: string | null;
  imageData: string | null;
  createdAt: Date;
  component: {
    id: number;
    name: string;
    material: string | null;
    job: {
      id: number;
      jobNumber: number | null;
      customerName: string;
    };
  } | null;
};

type SortField = "date" | "name" | "type" | "job";

export function FusionList({ logs }: { logs: FusionLog[] }) {
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
    return logs
      .filter(
        (l) =>
          l.modelName.toLowerCase().includes(q) ||
          l.component?.job.customerName.toLowerCase().includes(q) ||
          String(l.component?.job.jobNumber ?? "").includes(q) ||
          l.component?.name.toLowerCase().includes(q) ||
          l.notes?.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        let val = 0;
        if (sortField === "name") val = a.modelName.localeCompare(b.modelName);
        if (sortField === "type") val = a.type.localeCompare(b.type);
        if (sortField === "job")
          val = (a.component?.job.customerName ?? "").localeCompare(
            b.component?.job.customerName ?? ""
          );
        if (sortField === "date")
          val = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sortDir === "asc" ? val : -val;
      });
  }, [logs, search, sortField, sortDir]);

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by model name, customer, job number..."
          className="pl-9"
        />
      </div>

      {/* Sort bar */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="mr-2">Sort:</span>
        {(["date", "name", "type", "job"] as SortField[]).map((f) => (
          <button
            key={f}
            onClick={() => toggleSort(f)}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
              sortField === f
                ? "border-orange-500 text-orange-500"
                : "border-border hover:border-zinc-500"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {sortField === f && <ArrowUpDown className="w-3 h-3" />}
          </button>
        ))}
        <span className="ml-auto">{filtered.length} logs</span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          No logs match your search
        </div>
      ) : (
        <div className="border border-border rounded overflow-hidden">
          {filtered.map((log, i) => {
            const isExpanded = expanded.has(log.id);
            const fusionComponents = (() => {
              try { return JSON.parse(log.components); } catch { return []; }
            })();

            return (
              <div key={log.id} className={i !== 0 ? "border-t border-border" : ""}>
                {/* Row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => toggleExpand(log.id)}
                >
                  {/* Expand icon */}
                  <span className="text-muted-foreground w-4 shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>

                  {/* Type icon */}
                  {log.type === "DRAWING" ? (
                    <FileImage className="w-4 h-4 text-orange-500 shrink-0" />
                  ) : (
                    <Box className="w-4 h-4 text-orange-500 shrink-0" />
                  )}

                  {/* Model name */}
                  <span className="text-sm font-medium flex-1 truncate">
                    {log.modelName}
                  </span>

                  {/* Stats */}
                  <div className="flex items-center gap-3 shrink-0">
                    {log.component?.job && (
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {log.component.job.customerName}
                        {log.component.job.jobNumber
                          ? ` · #${log.component.job.jobNumber}`
                          : ""}
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {log.type === "DRAWING" ? "DWG" : "MDL"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="px-11 pb-4 space-y-3 bg-accent/20">
                    {/* Dimensions */}
                    {log.type === "MODEL" && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {log.boundingX}" × {log.boundingY}" × {log.boundingZ}"
                        · {log.bodies} {log.bodies === 1 ? "body" : "bodies"}
                      </p>
                    )}

                    {/* PDF */}
                    {log.imageData && (
                      <div className="border border-border rounded overflow-hidden">
                        <iframe
                          src={`data:application/pdf;base64,${log.imageData}`}
                          className="w-full h-96 border-0"
                          title={log.modelName}
                        />
                      </div>
                    )}

                    {/* Components */}
                    {fusionComponents.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {fusionComponents.map((c: string) => (
                          <Badge key={c} variant="secondary" className="text-xs">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {log.notes && (
                      <p className="text-xs text-muted-foreground">{log.notes}</p>
                    )}

                    {/* Link to component */}
                    {log.component?.job && (
                      <Link
                        href={`/jobs/${log.component.job.id}/${log.component.id}`}
                        className="text-xs text-orange-500 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View component →
                      </Link>
                    )}
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