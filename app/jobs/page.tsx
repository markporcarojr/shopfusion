import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { CreateJobForm } from "./CreateJobForm";
import { JobStatusSelect } from "./JobStatusSelect";
import { JobActions } from "./JobActions";
import Link from "next/link";

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

export default async function JobsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    user = await prisma.user.create({ data: { clerkId: userId } });
  }

  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    orderBy: { id: "desc" },
    include: { timeEntries: true },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground text-sm">{jobs.length} total</p>
        </div>
        <CreateJobForm />
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-2 text-muted-foreground text-sm p-6">
            <AlertCircle className="w-4 h-4" />
            No jobs yet — create one to get started
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const totalHours = job.timeEntries.reduce(
              (acc, e) => acc + e.hours,
              0,
            );
            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-base">
                        {job.customerName}
                      </CardTitle>
                      {job.description && (
                        <p className="text-xs text-muted-foreground mt-1">
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
                      <JobStatusSelect
                        jobId={job.id}
                        currentStatus={job.status}
                      />
                      <Badge
                        className={statusColor(job.status)}
                        variant="outline"
                      >
                        {job.status}
                      </Badge>
                      <JobActions job={job} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {job.timeEntries
                          .reduce((acc, e) => acc + e.hours, 0)
                          .toFixed(1)}{" "}
                        hrs · {job.timeEntries.length} entries
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
