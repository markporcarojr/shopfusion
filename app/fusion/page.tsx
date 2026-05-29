import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Box, FileImage } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FusionPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const logs = await prisma.fusionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { job: true },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fusion Models</h1>
          <p className="text-muted-foreground text-sm">
            {logs.length} log{logs.length !== 1 ? "s" : ""} captured from Fusion
            360
          </p>
        </div>
        <div className="text-xs text-muted-foreground border border-border px-3 py-2 rounded font-mono">
          POST /api/fusion/log
        </div>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-2 text-muted-foreground text-sm p-6">
            <AlertCircle className="w-4 h-4" />
            No models logged yet — run the Fusion add-in to capture your first
            model
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const components = (() => {
              try {
                return JSON.parse(log.components);
              } catch {
                return [];
              }
            })();

            return (
              <Card key={log.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    {log.type === "DRAWING" ? (
                      <FileImage className="w-4 h-4 text-orange-500" />
                    ) : (
                      <Box className="w-4 h-4 text-orange-500" />
                    )}
                    <div>
                      <CardTitle className="text-base">
                        {log.modelName}
                      </CardTitle>
                      {log.job && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {log.job.customerName}
                          {log.job.jobNumber ? ` · #${log.job.jobNumber}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {log.type === "MODEL" && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {log.boundingX}" × {log.boundingY}" × {log.boundingZ}"
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {log.type === "DRAWING" ? "Drawing" : "Model"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Blueprint image */}
                  {log.imageData && (
                    <div className="border border-border rounded overflow-hidden">
                      <img
                        src={`data:image/png;base64,${log.imageData}`}
                        alt={log.modelName}
                        className="w-full object-contain max-h-96 bg-white"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {components.map((c: string) => (
                        <Badge key={c} variant="secondary" className="text-xs">
                          {c}
                        </Badge>
                      ))}
                    </div>
                    {log.notes && (
                      <span className="text-xs text-muted-foreground">
                        {log.notes}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
