"use server"

import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/lib/auth-session"

export async function getPayablesReceivablesData() {
  const userId = await requireUserId()

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      settlementDate: null,
    },
    include: {
      category: true,
      account: true,
      paymentMethod: true,
    },
    orderBy: {
      issueDate: "asc",
    },
  })

  return transactions
}
