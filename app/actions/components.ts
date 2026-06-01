"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createComponent(jobId: number, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const name = formData.get("name") as string;
  const material = formData.get("material") as string;
  const operations = formData.get("operations") as string;
  const notes = formData.get("notes") as string;

  if (!name) throw new Error("Component name is required");

  await prisma.component.create({
    data: {
      name,
      material: material || null,
      operations: operations || null,
      notes: notes || null,
      jobId,
    },
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function updateComponent(
  componentId: number,
  jobId: number,
  formData: FormData
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const name = formData.get("name") as string;
  const material = formData.get("material") as string;
  const operations = formData.get("operations") as string;
  const notes = formData.get("notes") as string;

  await prisma.component.update({
    where: { id: componentId },
    data: {
      name,
      material: material || null,
      operations: operations || null,
      notes: notes || null,
    },
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/${componentId}`);
}

export async function deleteComponent(componentId: number, jobId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  await prisma.component.delete({
    where: { id: componentId },
  });

  revalidatePath(`/jobs/${jobId}`);
}