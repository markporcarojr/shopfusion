"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTimeEntry(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const jobId = formData.get("jobId") as string;
  const hours = formData.get("hours") as string;
  const note = formData.get("note") as string;
  const date = formData.get("date") as string;

  if (!jobId || !hours) throw new Error("Job and hours are required");

  await prisma.timeEntry.create({
    data: {
      jobId: parseInt(jobId),
      hours: parseFloat(hours),
      note: note || null,
      date: date ? new Date(date) : new Date(),
    },
  });

  revalidatePath("/time");
  revalidatePath("/dashboard");
}

export async function deleteTimeEntry(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  await prisma.timeEntry.delete({
    where: { id, job: { userId: user.id } },
  });

  revalidatePath("/time");
  revalidatePath("/dashboard");
}

export async function updateTimeEntry(id: number, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const hours = formData.get("hours") as string;
  const note = formData.get("note") as string;
  const date = formData.get("date") as string;

  await prisma.timeEntry.update({
    where: { id, job: { userId: user.id } },
    data: {
      hours: parseFloat(hours),
      note: note || null,
      date: date ? new Date(date) : new Date(),
    },
  });

  revalidatePath("/time");
  revalidatePath("/dashboard");
}
