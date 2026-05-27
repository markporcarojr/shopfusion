import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Clock, Box, AlertCircle } from "lucide-react";

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

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const [jobs, recentTime, recentFusion] = await Promise.all([
    prisma.job.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { timeEntries: true },
    }),
    prisma.timeEntry.findMany({
      where: { job: { userId: user.id } },
      orderBy: { date: "desc" },
      take: 5,
      include: { job: true },
    }),
    prisma.fusionLog.findMany({
      where: { job: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { job: true },
    }),
  ]);

  const activeJobs = jobs.filter((j) => j.status === "ACTIVE").length;
  const totalHours = recentTime.reduce((acc, e) => acc + e.hours, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back to ShopFusion
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {activeJobs}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Hours This Week
            </CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fusion Models</CardTitle>
            <Box className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentFusion.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <AlertCircle className="w-4 h-4" />
              No jobs yet
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <span className="font-medium text-sm">
                      {job.customerName}
                    </span>
                    {job.description && (
                      <p className="text-xs text-muted-foreground">
                        {job.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {job.jobNumber && (
                      <span className="text-xs text-muted-foreground">
                        #{job.jobNumber}
                      </span>
                    )}
                    <Badge
                      className={statusColor(job.status)}
                      variant="outline"
                    >
                      {job.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Recent Time Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTime.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <AlertCircle className="w-4 h-4" />
              No time logged yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentTime.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <span className="font-medium text-sm">
                      {entry.job.customerName}
                    </span>
                    {entry.note && (
                      <p className="text-xs text-muted-foreground">
                        {entry.note}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-mono text-orange-500">
                    {entry.hours}h
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Fusion Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Recent Fusion Models
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentFusion.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <AlertCircle className="w-4 h-4" />
              No models logged yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentFusion.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <span className="font-medium text-sm">{log.modelName}</span>
                    {log.job && (
                      <p className="text-xs text-muted-foreground">
                        {log.job.customerName}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {log.boundingX}&quot; × {log.boundingY}&quot; ×{" "}
                    {log.boundingZ}&quot;
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
