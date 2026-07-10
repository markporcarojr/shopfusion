import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FusionList } from "./FusionList";

export const dynamic = "force-dynamic";

export default async function FusionPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const logs = await prisma.fusionLog.findMany({
    where: { type: "DRAWING" },
    orderBy: { createdAt: "desc" },
    include: {
      component: {
        include: { job: true },
      },
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Drawings</h1>
          <p className="text-muted-foreground text-sm">
            {logs.length} drawing{logs.length !== 1 ? "s" : ""} captured from
            Fusion 360
          </p>
        </div>
        <div className="text-xs text-muted-foreground border border-border px-3 py-2 rounded font-mono">
          POST /api/fusion/log
        </div>
      </div>
      <FusionList logs={logs} />
    </div>
  );
}