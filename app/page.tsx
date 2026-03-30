import { prisma } from "@/lib/prisma"
import { DashboardClient } from "@/components/dashboard-client"
import { requireUserId } from "@/lib/auth-session"

export default async function Home() {
  const userId = await requireUserId()

  const [incomes, expenses, recentTransactions] = await Promise.all([
    prisma.transaction.aggregate({
      where: { direction: "IN", userId },
      _sum: { amountCents: true }
    }),
    prisma.transaction.aggregate({
      where: { direction: "OUT", userId },
      _sum: { amountCents: true }
    }),
    prisma.transaction.findMany({
      where: { userId },
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
