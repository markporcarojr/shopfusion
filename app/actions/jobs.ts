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

  if (!customerName) throw new Error("Customer name is required");

  await prisma.job.create({
    data: {
      customerName,
      jobNumber: jobNumber ? parseInt(jobNumber) : null,
      description: description || null,
      userId: user.id,
    },
  });

  revalidatePath("/jobs");
}

export async function updateJobStatus(
  jobId: number,
  status: "ACTIVE" | "PAUSED" | "DONE",
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
