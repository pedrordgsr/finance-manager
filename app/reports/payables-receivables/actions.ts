"use server"

import { prisma } from "@/lib/prisma"

export async function getPayablesReceivablesData() {
  const transactions = await prisma.transaction.findMany({
    where: {
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
