"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/current-user";
import { type ContainerAction, dockerAction } from "@/lib/docker";

async function perform(id: string, action: ContainerAction) {
  const user = await requireAdmin();
  if (!user) {
    throw new Error("unauthorized");
  }

  await dockerAction(id, action);
  revalidatePath(`/containers/${id}`);
  revalidatePath("/containers");
  revalidatePath("/");
}

export async function startContainer(id: string) {
  await perform(id, "start");
}

export async function stopContainer(id: string) {
  await perform(id, "stop");
}

export async function restartContainer(id: string) {
  await perform(id, "restart");
}
