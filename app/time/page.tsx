import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { LogTimeForm } from "./LogTimeForm";
import { DeleteTimeEntry } from "./DeleteTimeEntry";

export const dynamic = "force-dynamic";

export default async function TimePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    user = await prisma.user.create({ data: { clerkId: userId } });
  }

  const [jobs, entries] = await Promise.all([
    prisma.job.findMany({
      where: { userId: user.id, status: { not: "DONE" } },
      orderBy: { id: "desc" },
    }),
    prisma.timeEntry.findMany({
      where: { job: { userId: user.id } },
      orderBy: { date: "desc" },
      take: 20,
      include: { job: true },
    }),
  ]);

  const totalHours = entries.reduce((acc, e) => acc + e.hours, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time</h1>
          <p className="text-muted-foreground text-sm">
            {totalHours.toFixed(1)} hrs logged across {entries.length} entries
          </p>
        </div>
        <LogTimeForm jobs={jobs} />
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-2 text-muted-foreground text-sm p-6">
            <AlertCircle className="w-4 h-4" />
            No time logged yet — create a job first then log time against it
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">
                    {entry.job.customerName}
                  </CardTitle>
                  {entry.note && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {entry.note}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-orange-500 font-bold">
                    {entry.hours}h
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                  <DeleteTimeEntry id={entry.id} />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
