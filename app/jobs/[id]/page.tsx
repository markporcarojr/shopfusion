import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LogTimeForm } from "../LogTimeForm";
import { TimeEntryActions } from "./TimeEntryActions";
import { JobActions } from "../JobActions";
import { JobStatusSelect } from "../JobStatusSelect";

export const dynamic = "force-dynamic";

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

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const job = await prisma.job.findUnique({
    where: { id: parseInt(id), userId: user.id },
    include: {
      timeEntries: { orderBy: { date: "desc" } },
      fusionLogs: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!job) notFound();

  const totalHours = job.timeEntries.reduce((acc, e) => acc + e.hours, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/jobs"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Jobs
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {job.customerName}
            </h1>
            {job.description && (
              <p className="text-muted-foreground text-sm mt-1">
                {job.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {job.jobNumber && (
              <span className="text-xs text-muted-foreground font-mono">
                #{job.jobNumber}
              </span>
            )}
            <JobStatusSelect jobId={job.id} currentStatus={job.status} />
            <Badge className={statusColor(job.status)} variant="outline">
              {job.status}
            </Badge>
            <JobActions job={job} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {totalHours.toFixed(1)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{job.timeEntries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fusion Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{job.fusionLogs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Time Entries</CardTitle>
          <LogTimeForm jobs={[job]} defaultJobId={job.id} />
        </CardHeader>
        <CardContent>
          {job.timeEntries.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <AlertCircle className="w-4 h-4" />
              No time logged yet
            </div>
          ) : (
            <div className="space-y-2">
              {job.timeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    {entry.note && <p className="text-sm">{entry.note}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-orange-500 font-bold">
                      {entry.hours}h
                    </span>
                    <TimeEntryActions entry={entry} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fusion Logs */}
      {job.fusionLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Fusion Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {job.fusionLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm">{log.modelName}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {log.boundingX}" × {log.boundingY}" × {log.boundingZ}"
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
