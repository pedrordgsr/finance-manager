import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";

export async function getCurrentUserId(): Promise<number | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) {
    return null;
  }

  const parsedId = Number(id);
  if (!Number.isFinite(parsedId)) {
    return null;
  }

  return parsedId;
}

export async function requireUserId(): Promise<number> {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/login");
  }

  return userId;
}
