import { PDFViewer } from "@/components/pdf-viewer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { suggestStock } from "@/lib/stock-suggestion";
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

  const latestModel = component.fusionLogs.find((l) => l.type === "MODEL");
  const stockSuggestion = latestModel
    ? suggestStock(
        latestModel.boundingX,
        latestModel.boundingY,
        latestModel.boundingZ,
        component.stockType,
        component.material,
      )
    : null;

  return (
    <div className="p-6 space-y-6">
      <Link
        href={`/jobs/${id}`}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to {component.job.customerName}
      </Link>

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

      {/* Stock Suggestion */}
      {stockSuggestion && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Suggested Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-orange-500 font-mono font-bold text-lg">
                  {stockSuggestion.label}
                </span>
                <Badge variant="outline" className="text-xs">
                  {stockSuggestion.type.replace("_", " ")}
                </Badge>
              </div>
              {stockSuggestion.weightLbs && (
                <span className="text-sm font-mono text-muted-foreground">
                  ~{stockSuggestion.weightLbs} lbs
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
                    <div className="flex items-center gap-2 flex-wrap">
                      {log.type === "DRAWING" ? (
                        <FileImage className="w-4 h-4 text-orange-500 shrink-0" />
                      ) : (
                        <Box className="w-4 h-4 text-orange-500 shrink-0" />
                      )}
                      <span className="font-medium text-sm">
                        {component.name}
                      </span>
                      {log.revision && (
                        <span className="text-xs border border-border px-2 py-0.5 rounded font-mono text-muted-foreground">
                          Rev {log.revision}
                        </span>
                      )}
                      {log.sheetSize && (
                        <span className="text-xs border border-border px-2 py-0.5 rounded font-mono text-muted-foreground">
                          {log.sheetSize} Sheet
                        </span>
                      )}
                      {log.type === "MODEL" && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.boundingX}&quot; × {log.boundingY}&quot; ×{" "}
                          {log.boundingZ}&quot;
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {log.type === "DRAWING" ? "Drawing" : "Model"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                      <FusionLogActions
                        log={{
                          id: log.id,
                          notes: log.notes,
                          modelName: component.name,
                          componentId: component.id,
                          jobId: component.job.id,
                        }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {log.imageData && (
                      <PDFViewer data={log.imageData} title={component.name} />
                    )}

                    {(log.mass || log.volume || log.surfaceArea) && (
                      <div className="grid grid-cols-3 gap-2">
                        {log.mass && (
                          <div className="bg-accent/50 rounded px-3 py-2 text-center">
                            <div className="text-xs text-muted-foreground">
                              Mass
                            </div>
                            <div className="text-sm font-mono font-medium">
                              {log.mass} lbs
                            </div>
                          </div>
                        )}
                        {log.volume && (
                          <div className="bg-accent/50 rounded px-3 py-2 text-center">
                            <div className="text-xs text-muted-foreground">
                              Volume
                            </div>
                            <div className="text-sm font-mono font-medium">
                              {log.volume} in³
                            </div>
                          </div>
                        )}
                        {log.surfaceArea && (
                          <div className="bg-accent/50 rounded px-3 py-2 text-center">
                            <div className="text-xs text-muted-foreground">
                              Surface Area
                            </div>
                            <div className="text-sm font-mono font-medium">
                              {log.surfaceArea} in²
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {fusionComponents.length > 0 && (
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
                    )}

                    {log.notes && (
                      <p className="text-xs text-muted-foreground">
                        {log.notes}
                      </p>
                    )}
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
