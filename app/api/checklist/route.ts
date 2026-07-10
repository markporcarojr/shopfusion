import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Resolve the app user from Clerk, or null
async function getUser() {
  const { userId } = await auth();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { clerkId: userId } });
}

// Confirm this checklist item belongs to a job owned by the user
async function ownsItem(itemId: number, userDbId: number) {
  const item = await prisma.checklistItem.findFirst({
    where: { id: itemId, job: { userId: userDbId } },
    select: { id: true, jobId: true },
  });
  return item;
}

// POST — add a new item to a job
// body: { jobId: number, text: string }
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const jobId = Number(body?.jobId);
  const text = String(body?.text ?? "").trim();

  if (!jobId || !text) {
    return NextResponse.json({ error: "jobId and text required" }, { status: 400 });
  }

  // Ownership check on the parent job
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
    select: { id: true },
  });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  // Append to end: order = current max + 1
  const last = await prisma.checklistItem.findFirst({
    where: { jobId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const item = await prisma.checklistItem.create({
    data: { jobId, text, order: (last?.order ?? -1) + 1 },
  });

  return NextResponse.json(item, { status: 201 });
}

// PATCH — toggle checked and/or edit text of one item
// body: { id: number, checked?: boolean, text?: string }
export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = Number(body?.id);
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const owned = await ownsItem(id, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: { checked?: boolean; text?: string } = {};
  if (typeof body.checked === "boolean") data.checked = body.checked;
  if (typeof body.text === "string" && body.text.trim()) data.text = body.text.trim();

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const item = await prisma.checklistItem.update({ where: { id }, data });
  return NextResponse.json(item);
}

// PUT — reorder items within a job
// body: { jobId: number, orderedIds: number[] }
export async function PUT(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const jobId = Number(body?.jobId);
  const orderedIds: number[] = Array.isArray(body?.orderedIds)
    ? body.orderedIds.map(Number)
    : [];

  if (!jobId || orderedIds.length === 0) {
    return NextResponse.json({ error: "jobId and orderedIds required" }, { status: 400 });
  }

  // Verify job ownership AND that every id belongs to this job
  const jobItems = await prisma.checklistItem.findMany({
    where: { jobId, job: { userId: user.id } },
    select: { id: true },
  });
  const validIds = new Set(jobItems.map((i) => i.id));
  if (jobItems.length === 0 || orderedIds.some((id) => !validIds.has(id))) {
    return NextResponse.json({ error: "Invalid items for job" }, { status: 400 });
  }

  // Atomic reorder: order = index in the array
  await prisma.$transaction(
    orderedIds.map((id, order) =>
      prisma.checklistItem.update({ where: { id }, data: { order } }),
    ),
  );

  return NextResponse.json({ ok: true });
}

// DELETE — remove one item
// body: { id: number }
export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = Number(body?.id);
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const owned = await ownsItem(id, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.checklistItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}