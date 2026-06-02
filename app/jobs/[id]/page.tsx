import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { AlertCircle, ArrowLeft, Box } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { JobActions } from "../JobActions";
import { JobStatusSelect } from "../JobStatusSelect";
import { LogTimeForm } from "../LogTimeForm";
import { ComponentActions } from "./ComponentActions";
import { CreateComponentForm } from "./CreateComponentForm";
import { TimeEntryActions } from "./TimeEntryActions";

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
      components: {
        include: {
          fusionLogs: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      timeEntries: { orderBy: { date: "desc" } },
    },
  });

  if (!job) notFound();

  const totalHours = job.timeEntries.reduce((acc, e) => acc + e.hours, 0);
  const totalFusionLogs = job.components.reduce(
    (acc, c) => acc + c.fusionLogs.length,
    0,
  );

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <Link
        href="/jobs"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Jobs
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font tracking-tight">
            {job.customerName.toLocaleUpperCase()}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {job.jobNumber ? `#${job.jobNumber}` : "No Job Number"}
          </h1>
          {job.description && (
            <p className="text-muted-foreground mt-1">
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Time Logged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {totalHours.toFixed(1)}h
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{job.components.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fusion Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFusionLogs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Components */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Components</h2>
          <CreateComponentForm jobId={job.id} />
        </div>

        {job.components.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-2 text-muted-foreground text-sm p-6">
              <AlertCircle className="w-4 h-4" />
              No components yet — add one manually or fire the Fusion add-in
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {job.components.map((comp) => (
              <Card
                key={comp.id}
                className="hover:bg-accent/50 transition-colors"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Link href={`/jobs/${job.id}/${comp.id}`} className="flex-1">
                    <div>
                      <CardTitle className="text-base">{comp.name}</CardTitle>
                      {comp.material && (
                        <span className="text-xs text-orange-400 border border-orange-900 px-2 py-0.5 rounded font-mono mt-1 inline-block">
                          {comp.material}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Box className="w-3.5 h-3.5" />
                      {comp.fusionLogs.length} log
                      {comp.fusionLogs.length !== 1 ? "s" : ""}
                    </div>
                    <ComponentActions component={comp} />
                    <Badge variant="outline" className="text-xs">
                      View →
                    </Badge>
                  </div>
                </CardHeader>
                {comp.operations && (
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {comp.operations}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
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
    </div>
  );
}
