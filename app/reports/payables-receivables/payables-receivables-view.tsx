"use client"

import { useState, useMemo } from "react"
import { useTranslations, useLocale } from "next-intl"
import { 
  Receipt, 
  TrendingDown, 
  TrendingUp, 
  Wallet,
  ArrowRight,
  Filter,
  Search,
  Calendar
} from "lucide-react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency as formatCurrencyUtil, formatDate } from "@/lib/utils"
import { useSettings } from "@/components/settings-provider"
import type { Category, Account, PaymentMethod, Transaction } from "@/generated/prisma/client"

type TransactionWithRelations = Transaction & {
  category: Category
  account: Account | null
  paymentMethod: PaymentMethod | null
}

interface PayablesReceivablesViewProps {
  initialData: TransactionWithRelations[]
}

export function PayablesReceivablesView({ initialData }: PayablesReceivablesViewProps) {
  const t = useTranslations("payablesReceivables")
  const locale = useLocale()
  const { settings } = useSettings()
  
  const [searchTerm, setSearchTerm] = useState("")
  
  const formatCurrency = (cents: number) => {
    return formatCurrencyUtil(cents, locale, settings.currency)
  }

  const receivables = useMemo(() => {
    return initialData.filter(tx => tx.direction === "IN")
  }, [initialData])

  const payables = useMemo(() => {
    return initialData.filter(tx => tx.direction === "OUT")
  }, [initialData])

  const totals = useMemo(() => {
    return {
      receivable: receivables.reduce((sum, tx) => sum + tx.amountCents, 0),
      payable: payables.reduce((sum, tx) => sum + tx.amountCents, 0)
    }
  }, [receivables, payables])

  const filterTransactions = (txs: TransactionWithRelations[]) => {
    if (!searchTerm) return txs
    const term = searchTerm.toLowerCase()
    return txs.filter(tx => 
      tx.description.toLowerCase().includes(term) || 
      tx.category.name.toLowerCase().includes(term)
    )
  }

  return (
    <div className="flex flex-col h-full gap-4 md:gap-6 overflow-hidden">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-green-50/30 dark:bg-green-950/10 border-green-100 dark:border-green-950/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              {t("receivable")}
            </CardDescription>
            <CardTitle className="text-2xl text-green-600 dark:text-green-400">
              {formatCurrency(totals.receivable)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-red-50/30 dark:bg-red-950/10 border-red-100 dark:border-red-950/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              {t("payable")}
            </CardDescription>
            <CardTitle className="text-2xl text-red-600 dark:text-red-400">
              {formatCurrency(totals.payable)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex items-center gap-2 max-w-sm mb-2">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("description") + "..."}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="receivable" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start md:w-auto">
          <TabsTrigger value="receivable" className="flex-1 md:flex-none gap-2">
            {t("receivable")}
            <Badge variant="secondary" className="ml-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              {receivables.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="payable" className="flex-1 md:flex-none gap-2">
            {t("payable")}
            <Badge variant="secondary" className="ml-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              {payables.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto mt-4 rounded-md border bg-card">
          <TabsContent value="receivable" className="m-0 h-full overflow-auto">
            <TransactionTable 
              transactions={filterTransactions(receivables)} 
              t={t} 
              formatCurrency={formatCurrency} 
              locale={locale} 
              isIncome={true}
            />
          </TabsContent>
          <TabsContent value="payable" className="m-0 h-full overflow-auto">
            <TransactionTable 
              transactions={filterTransactions(payables)} 
              t={t} 
              formatCurrency={formatCurrency} 
              locale={locale} 
              isIncome={false}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

function TransactionTable({ 
  transactions, 
  t, 
  formatCurrency, 
  locale,
  isIncome
}: { 
  transactions: TransactionWithRelations[], 
  t: any, 
  formatCurrency: (cents: number) => string,
  locale: string,
  isIncome: boolean
}) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
        <Receipt className="h-10 w-10 opacity-20" />
        <p>{t("noPending")}</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40%]">{t("description")}</TableHead>
          <TableHead>{t("category")}</TableHead>
          <TableHead>{t("issueDate")}</TableHead>
          <TableHead className="text-right">{t("amount")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell className="font-medium">
              <div className="flex flex-col">
                <span>{tx.description}</span>
                {tx.account && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Wallet className="h-3 w-3" /> {tx.account.name}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{tx.category.name}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(tx.issueDate, locale)}
              </div>
            </TableCell>
            <TableCell className={`text-right font-bold ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(tx.amountCents)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
