import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      jobNumber,
      modelName,
      componentName,
      type,
      bodies,
      boundingBox,
      components,
      notes,
      imageData,
      material,
      revision,
      sheetSize,
      mass,
      volume,
      surfaceArea,
    } = body;

    if (!modelName) {
      return NextResponse.json(
        { error: "modelName is required" },
        { status: 400 },
      );
    }

    let job = null;
    let component = null;

    if (jobNumber) {
      job = await prisma.job.findFirst({
        where: { jobNumber: parseInt(jobNumber) },
      });

      if (!job) {
        const user = await prisma.user.findFirst();
        if (user) {
          job = await prisma.job.create({
            data: {
              jobNumber: parseInt(jobNumber),
              customerName: modelName,
              description: `Created from Fusion 360`,
              userId: user.id,
              status: "ACTIVE",
            },
          });
        }
      }

      if (job) {
        const compName = componentName || modelName;
        component = await prisma.component.findFirst({
          where: { jobId: job.id, name: compName },
        });

        if (!component) {
          component = await prisma.component.create({
            data: {
              name: compName,
              material: material || null,
              jobId: job.id,
            },
          });
        } else if (material && !component.material) {
          component = await prisma.component.update({
            where: { id: component.id },
            data: { material },
          });
        }
      }
    }

    const log = await prisma.fusionLog.create({
      data: {
        type: type || "MODEL",
        modelName: String(modelName),
        revision: revision ? String(revision) : null,
        sheetSize: sheetSize ? String(sheetSize) : null,
        mass: mass ? Number(mass) : null,
        volume: volume ? Number(volume) : null,
        surfaceArea: surfaceArea ? Number(surfaceArea) : null,
        bodies: Number(bodies) || 0,
        boundingX: Number(boundingBox?.x) || 0,
        boundingY: Number(boundingBox?.y) || 0,
        boundingZ: Number(boundingBox?.z) || 0,
        components: JSON.stringify(Array.isArray(components) ? components : []),
        notes: notes ? String(notes) : null,
        imageData: imageData ? String(imageData) : null,
        componentId: component?.id ?? null,
      },
    });

    return NextResponse.json(
      { success: true, id: log.id, jobId: job?.id ?? null },
      { status: 200 },
    );
  } catch (error) {
    console.error("[fusion/log] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "/api/fusion/log" });
}
