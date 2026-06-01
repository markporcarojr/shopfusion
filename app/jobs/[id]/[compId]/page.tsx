import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { AlertCircle, ArrowLeft, Box, FileImage } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ComponentActions } from "../ComponentActions";
import { FusionLogActions } from "./FusionLogActions";

export const dynamic = "force-dynamic";

export default async function ComponentDetailPage({
  params,
}: {
  params: Promise<{ id: string; compId: string }>;
}) {
  const { id, compId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const component = await prisma.component.findUnique({
    where: { id: parseInt(compId) },
    include: {
      job: true,
      fusionLogs: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!component || component.job.userId !== user.id) notFound();

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <Link
        href={`/jobs/${id}`}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to {component.job.customerName}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {component.name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {component.job.customerName}
            {component.job.jobNumber ? ` · #${component.job.jobNumber}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {component.material && (
            <span className="text-xs text-orange-400 border border-orange-900 px-3 py-1 rounded font-mono">
              {component.material}
            </span>
          )}
          <ComponentActions component={component} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fusion Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {component.fusionLogs.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Drawings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {component.fusionLogs.filter((l) => l.type === "DRAWING").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations */}
      {component.operations && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {component.operations}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {component.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{component.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Fusion Logs */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Fusion Logs</h2>

        {component.fusionLogs.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-2 text-muted-foreground text-sm p-6">
              <AlertCircle className="w-4 h-4" />
              No Fusion logs yet — fire the add-in with this component name
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {component.fusionLogs.map((log) => {
              const fusionComponents = (() => {
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
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.type === "MODEL" && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.boundingX}" × {log.boundingY}" × {log.boundingZ}"
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {log.type === "DRAWING" ? "Drawing" : "Model"}
                      </Badge>
                      <FusionLogActions
                        log={{
                          id: log.id,
                          notes: log.notes,
                          modelName: log.modelName,
                          componentId: component.id,
                          jobId: component.job.id,
                        }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {log.imageData && (
                      <div className="border border-border rounded overflow-hidden">
                        <iframe
                          src={`data:application/pdf;base64,${log.imageData}`}
                          className="w-full h-96 border-0"
                          title={log.modelName}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {fusionComponents.map((c: string) => (
                          <Badge
                            key={c}
                            variant="secondary"
                            className="text-xs"
                          >
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
    </div>
  );
}
