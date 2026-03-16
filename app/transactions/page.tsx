import { prisma } from "@/lib/prisma"
import { TransactionsTable } from "@/components/transactions-table"
import { getTranslations } from "next-intl/server"

interface TransactionsPageProps {
    searchParams: Promise<{
        page?: string
        search?: string
        direction?: string
        categoryId?: string
        accountId?: string
        paymentMethodId?: string
        settled?: string
    }>
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
    const t = await getTranslations("transactions")
    const params = await searchParams

    const currentPage = parseInt(params.page || "1")
    const itemsPerPage = 10
    const searchQuery = params.search || ""
    const direction = params.direction || ""
    const categoryId = params.categoryId || ""
    const accountId = params.accountId || ""
    const paymentMethodId = params.paymentMethodId || ""
    const settled = params.settled || ""

    const where: any = {}

    if (searchQuery) {
        where.description = { contains: searchQuery }
    }

    if (direction) {
        where.direction = direction
    }

    if (categoryId) {
        where.categoryId = parseInt(categoryId)
    }

    if (accountId) {
        where.accountId = parseInt(accountId)
    }

    if (paymentMethodId) {
        where.paymentMethodId = parseInt(paymentMethodId)
    }

    if (settled === "true") {
        where.settlementDate = { not: null }
    } else if (settled === "false") {
        where.settlementDate = null
    }

    const [
        transactions,
        totalCount,
        categories,
        accounts,
        paymentMethods
    ] = await Promise.all([
        prisma.transaction.findMany({
            where,
            orderBy: [
                { issueDate: "desc" },
                { createdAt: "desc" }
            ],
            skip: (currentPage - 1) * itemsPerPage,
            take: itemsPerPage,
            include: {
                category: true,
                account: true,
                paymentMethod: true,
            }
        }),
        prisma.transaction.count({ where }),
        prisma.category.findMany({ orderBy: { name: "asc" } }),
        prisma.account.findMany({ orderBy: { name: "asc" } }),
        prisma.paymentMethod.findMany({ orderBy: { name: "asc" } }),
    ])

    const totalPages = Math.ceil(totalCount / itemsPerPage)

    return (
        <div className="flex flex-col gap-4 p-4 pt-0">
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <TransactionsTable
                transactions={transactions}
                categories={categories}
                accounts={accounts}
                paymentMethods={paymentMethods}
                currentPage={currentPage}
                totalPages={totalPages}
                searchQuery={searchQuery}
            />
        </div>
    )
}
