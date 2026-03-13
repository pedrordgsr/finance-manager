import { prisma } from "@/lib/prisma"
import { DashboardClient } from "@/components/dashboard-client"

export default async function Home() {
  const [incomes, expenses, recentTransactions] = await Promise.all([
    prisma.transaction.aggregate({
      where: { direction: "IN" },
      _sum: { amountCents: true }
    }),
    prisma.transaction.aggregate({
      where: { direction: "OUT" },
      _sum: { amountCents: true }
    }),
    prisma.transaction.findMany({
      take: 5,
      orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
      include: {
        category: true,
      }
    })
  ])

  const initialData = {
    totalIncome: incomes._sum.amountCents || 0,
    totalExpense: expenses._sum.amountCents || 0,
    recentTransactions: recentTransactions,
  }

  return <DashboardClient initialData={initialData} />
}
