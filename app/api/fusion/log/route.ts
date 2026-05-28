import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      jobNumber,
      modelName,
      type,
      bodies,
      boundingBox,
      components,
      notes,
      imageData,
    } = body;

    if (!modelName) {
      return NextResponse.json(
        { error: "modelName is required" },
        { status: 400 },
      );
    }

    let job = null;
    if (jobNumber) {
      job = await prisma.job.findFirst({
        where: { jobNumber: parseInt(jobNumber) },
      });
    }

    const log = await prisma.fusionLog.create({
      data: {
        type: type || "MODEL",
        modelName: String(modelName),
        bodies: Number(bodies) || 0,
        boundingX: Number(boundingBox?.x) || 0,
        boundingY: Number(boundingBox?.y) || 0,
        boundingZ: Number(boundingBox?.z) || 0,
        components: JSON.stringify(Array.isArray(components) ? components : []),
        notes: notes ? String(notes) : null,
        imageData: imageData ? String(imageData) : null,
        jobId: job?.id ?? null,
      },
    });

    return NextResponse.json({ success: true, id: log.id }, { status: 200 });
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
