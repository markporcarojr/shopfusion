"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateFusionLog(
  logId: number,
  componentId: number,
  jobId: number,
  formData: FormData
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const notes = formData.get("notes") as string;

  await prisma.fusionLog.update({
    where: { id: logId },
    data: { notes: notes || null },
  });

  revalidatePath(`/jobs/${jobId}/${componentId}`);
  revalidatePath("/fusion");
}

export async function deleteFusionLog(
  logId: number,
  componentId: number,
  jobId: number
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await prisma.fusionLog.delete({
    where: { id: logId },
  });

  revalidatePath(`/jobs/${jobId}/${componentId}`);
  revalidatePath("/fusion");
}