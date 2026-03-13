"use server"

import { prisma } from "@/lib/prisma"

export async function getDreData(year: number) {
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999)

  const [transactions, categories, accounts, paymentMethods] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
        account: true,
        paymentMethod: true,
      },
      orderBy: {
        issueDate: "asc",
      },
    }),
    prisma.category.findMany(),
    prisma.account.findMany(),
    prisma.paymentMethod.findMany(),
  ])

  return {
    transactions,
    categories,
    accounts,
    paymentMethods,
  }
}
