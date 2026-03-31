"use client"

import { useTranslations, useLocale } from "next-intl"
import { ArrowDownCircle, ArrowUpCircle, Wallet, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSettings } from "@/components/settings-provider"

import type { Transaction, Category } from "@/generated/prisma/client"

interface DashboardProps {
  initialData: {
    totalIncome: number
    totalExpense: number
    recentTransactions: (Transaction & { category: Category })[]
  }
}

export function DashboardClient({ initialData }: DashboardProps) {
  const t = useTranslations("dashboard")
  const locale = useLocale()
  const { settings } = useSettings()

  const { totalIncome, totalExpense, recentTransactions } = initialData
  const balance = totalIncome - totalExpense

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en-US", {
      style: "currency",
      currency: settings.currency
    }).format(cents / 100)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("overview")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Income Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">{t("totalIncome")}</h3>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">
            {formatCurrency(totalIncome)}
          </div>
        </div>

        {/* Expenses Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">{t("totalExpense")}</h3>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold">
            {formatCurrency(totalExpense)}
          </div>
        </div>

        {/* Balance Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">{t("balance")}</h3>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">
            {formatCurrency(balance)}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex-1">
        <div className="flex flex-col space-y-1.5 p-6 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold leading-none tracking-tight">{t("recentTransactions")}</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions" className="flex items-center gap-1 text-muted-foreground">
                {t("viewAll")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="p-6 pt-0">
          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <p>{t("empty")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between bg-muted/40 p-4 rounded-lg">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm">{transaction.description}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(transaction.issueDate)}</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {transaction.category.name}
                      </Badge>
                    </div>
                  </div>
                  <div className={`font-semibold ${transaction.direction === "IN" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {transaction.direction === "IN" ? "+" : "-"} {formatCurrency(transaction.amountCents)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
