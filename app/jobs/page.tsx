import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CreateJobForm } from "./CreateJobForm";
import { JobsList } from "./JobsList";

export const dynamic = "force-dynamic";

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
    include: {
      timeEntries: true,
      components: true,
    },
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
      <JobsList jobs={jobs} />
    </div>
  );
}