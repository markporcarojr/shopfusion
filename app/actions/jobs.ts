"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createJob(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const customerName = formData.get("customerName") as string;
  const jobNumber = formData.get("jobNumber") as string;
  const description = formData.get("description") as string;
  const hoursWorked = formData.get("hoursWorked") as string;

  if (!customerName) throw new Error("Customer name is required");

  // Parse checklist (JSON array of strings, in drag order)
  const checklistRaw = formData.get("checklist");
  let checklistTexts: string[] = [];
  try {
    checklistTexts = checklistRaw ? JSON.parse(String(checklistRaw)) : [];
  } catch {
    checklistTexts = [];
  }
  // Drop blanks, trim
  checklistTexts = checklistTexts
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  await prisma.job.create({
    data: {
      customerName,
      jobNumber: jobNumber ? parseInt(jobNumber) : null,
      description: description || null,
      hoursWorked: hoursWorked ? parseFloat(hoursWorked) : null,
      userId: user.id,
      checklist: {
        create: checklistTexts.map((text, order) => ({ text, order })),
      },
    },
  });

  revalidatePath("/jobs");
}

export async function updateJob(jobId: number, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const customerName = formData.get("customerName") as string;
  const jobNumber = formData.get("jobNumber") as string;
  const description = formData.get("description") as string;
  const hoursWorked = formData.get("hoursWorked") as string;

  await prisma.job.update({
    where: { id: jobId, userId: user.id },
    data: {
      customerName,
      jobNumber: jobNumber ? parseInt(jobNumber) : null,
      description: description || null,
      hoursWorked: hoursWorked ? parseFloat(hoursWorked) : null,
    },
  });

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

export async function updateJobStatus(
  jobId: number,
  status: "ACTIVE" | "PAUSED" | "DONE"
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  await prisma.job.update({
    where: { id: jobId, userId: user.id },
    data: { status },
  });

  revalidatePath("/jobs");
}

export async function deleteJob(jobId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  await prisma.job.delete({
    where: { id: jobId, userId: user.id },
  });

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

export async function toggleChecklistItem(itemId: number, checked: boolean) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  // Ownership through the job relation
  const item = await prisma.checklistItem.findFirst({
    where: { id: itemId, job: { userId: user.id } },
    select: { id: true, jobId: true },
  });
  if (!item) throw new Error("Item not found");

  await prisma.checklistItem.update({
    where: { id: itemId },
    data: { checked },
  });

  revalidatePath(`/jobs/${item.jobId}`);
}

export async function addChecklistItem(jobId: number, text: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const cleaned = text.trim();
  if (!cleaned) throw new Error("Text required");

  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
    select: { id: true },
  });
  if (!job) throw new Error("Job not found");

  const last = await prisma.checklistItem.findFirst({
    where: { jobId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.checklistItem.create({
    data: { jobId, text: cleaned, order: (last?.order ?? -1) + 1 },
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function deleteChecklistItem(itemId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const item = await prisma.checklistItem.findFirst({
    where: { id: itemId, job: { userId: user.id } },
    select: { id: true, jobId: true },
  });
  if (!item) throw new Error("Item not found");

  await prisma.checklistItem.delete({ where: { id: itemId } });

  revalidatePath(`/jobs/${item.jobId}`);
}