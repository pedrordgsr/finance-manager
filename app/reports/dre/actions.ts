"use server"

import { prisma } from "@/lib/prisma"

export async function getDreData(year: number, accountingMode: "ACCRUAL" | "CASH" = "ACCRUAL") {
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999)

  const dateFilter = accountingMode === "ACCRUAL" 
    ? { issueDate: { gte: startDate, lte: endDate } }
    : { settlementDate: { gte: startDate, lte: endDate } }

  const [transactions, categories, accounts, paymentMethods, budgets] = await Promise.all([
    prisma.transaction.findMany({
      where: dateFilter,
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
    prisma.budget.findMany({
      where: {
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
  return await prisma.budget.upsert({
    where: {
      categoryId_month_year: {
        categoryId,
        month,
        year,
      },
    },
    update: {
      amountCents,
    },
    create: {
      categoryId,
      month,
      year,
      amountCents,
    },
  })
}
