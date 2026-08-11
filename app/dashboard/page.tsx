import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { AlertCircle, ArrowRight, Box, Briefcase } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusChart } from "./StatusChart";

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

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    user = await prisma.user.create({ data: { clerkId: userId } });
  }

  const clerkUser = await currentUser();
  const displayName = clerkUser?.firstName ?? clerkUser?.username ?? "there";

  const [jobs, recentTime, recentFusion] = await Promise.all([
    prisma.job.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { timeEntries: true, components: true },
    }),
    prisma.timeEntry.findMany({
      orderBy: { date: "desc" },
      take: 5,
      include: { job: true },
    }),
    prisma.fusionLog.findMany({
      where: {
        component: { job: { userId: user.id } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        component: { include: { job: true } },
      },
    }),
  ]);

  const allJobs = await prisma.job.findMany({
    where: { userId: user.id },
    select: { status: true },
  });

  const statusCounts = {
    active: allJobs.filter((j) => j.status === "ACTIVE").length,
    paused: allJobs.filter((j) => j.status === "PAUSED").length,
    done: allJobs.filter((j) => j.status === "DONE").length,
  };

  const activeJobs = jobs.filter((j) => j.status === "ACTIVE").length;
  const totalHours = jobs
    .filter((j) => j.status === "ACTIVE")
    .reduce((acc, j) => acc + (j.hoursWorked ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">{displayName}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Link href="/jobs">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
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
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
          </CardContent>
        </Card>

        <Link href="/fusion" className="hidden md:block">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Fusion Logs</CardTitle>
              <Box className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentFusion.length}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two column layout */}
      <div className=" gap-6 md:grid grid-cols-2">
        {/* Recent Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Recent Jobs</CardTitle>
            <Link
              href="/jobs"
              className="text-xs text-orange-500 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <AlertCircle className="w-4 h-4" />
                No jobs yet
              </div>
            ) : (
              <div className="space-y-1">
                {jobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="flex items-center justify-between py-2 px-2 rounded hover:bg-accent transition-colors">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm truncate block">
                          {job.customerName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {job.components.length} component
                          {job.components.length !== 1 ? "s" : ""}
                          {job.jobNumber ? ` · #${job.jobNumber}` : ""}
                        </span>
                      </div>
                      <Badge
                        className={statusColor(job.status)}
                        variant="outline"
                      >
                        {job.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Chart */}
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Jobs by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusChart data={statusCounts} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Fusion Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Recent Fusion Logs
          </CardTitle>
          <Link
            href="/fusion"
            className="text-xs text-orange-500 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentFusion.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <AlertCircle className="w-4 h-4" />
              No models logged yet
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {recentFusion.map((log) => (
                <Link
                  key={log.id}
                  href={
                    log.component?.job
                      ? `/jobs/${log.component.job.id}/${log.component.id}`
                      : "/fusion"
                  }
                >
                  <div className="flex items-center justify-between py-2 px-2 rounded hover:bg-accent transition-colors">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm truncate block">
                        {log.customerName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {log.component?.job?.customerName ?? "—"}
                        {log.component?.job?.jobNumber
                          ? ` · #${log.component.job.jobNumber}`
                          : ""}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {log.type === "DRAWING" ? "DWG" : "MDL"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
