"use server"

import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/lib/auth-session"

export async function getDreData(year: number, accountingMode: "ACCRUAL" | "CASH" = "ACCRUAL") {
  const userId = await requireUserId()
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999)

  const dateFilter = accountingMode === "ACCRUAL" 
    ? { issueDate: { gte: startDate, lte: endDate } }
    : { settlementDate: { gte: startDate, lte: endDate } }

  const [transactions, categories, accounts, paymentMethods, budgets] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        ...dateFilter,
        userId,
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
    prisma.category.findMany({ where: { userId } }),
    prisma.account.findMany({ where: { userId } }),
    prisma.paymentMethod.findMany({ where: { userId } }),
    prisma.budget.findMany({
      where: {
        userId,
        year,
      }
    })
  ])

  return {
    transactions,
    categories,
    accounts,
    paymentMethods,
    budgets,
  }
}

export async function updateBudget(categoryId: number, month: number, year: number, amountCents: number) {
  const userId = await requireUserId()

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  })

  if (!category) {
    throw new Error("Invalid category")
  }

  return await prisma.budget.upsert({
    where: {
      userId_categoryId_month_year: {
        userId,
        categoryId,
        month,
        year,
      },
    },
    update: {
      amountCents,
    },
    create: {
      userId,
      categoryId,
      month,
      year,
      amountCents,
    },
  })
}
