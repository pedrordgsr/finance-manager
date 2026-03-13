"use client"

import { useState, useMemo, Fragment } from "react"
import { useTranslations, useLocale } from "next-intl"
import { 
  ChevronDown, 
  ChevronRight, 
  ChevronUp,
  Filter,
  CalendarDays,
  LayoutGrid,
  TrendingDown,
  TrendingUp,
  Wallet,
  ArrowRight,
  CreditCard
} from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { formatCurrency as formatCurrencyUtil, formatDate } from "@/lib/utils"
import { useSettings } from "@/components/settings-provider"
import { getDreData } from "./actions"
import type { Category, Account, PaymentMethod, Transaction } from "@/generated/prisma/client"

type TransactionWithRelations = Transaction & {
  category: Category
  account: Account | null
  paymentMethod: PaymentMethod | null
}

interface DREViewProps {
  initialData: {
    transactions: TransactionWithRelations[]
    categories: Category[]
    accounts: Account[]
    paymentMethods: PaymentMethod[]
  }
  currentYear: number
}

type GroupByOption = "CATEGORY" | "ACCOUNT" | "PAYMENT_METHOD"

export function DREView({ initialData, currentYear: initialYear }: DREViewProps) {
  const t = useTranslations("dre")
  const locale = useLocale()
  const { settings } = useSettings()
  
  const isMobile = useIsMobile()
  const formatCurrency = (cents: number, loc: string) => {
    return formatCurrencyUtil(cents, loc, settings.currency)
  }
  const [year, setYear] = useState(initialYear)
  const [groupBy, setGroupBy] = useState<GroupByOption>("CATEGORY")
  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const months = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "short" })
    return Array.from({ length: 12 }, (_, i) => formatter.format(new Date(2000, i, 1)))
  }, [locale])

  const years = useMemo(() => {
    const yearsArr = []
    const current = new Date().getFullYear()
    for (let i = current; i >= current - 5; i--) {
      yearsArr.push(i)
    }
    return yearsArr
  }, [])

  const handleYearChange = async (newYear: number) => {
    setIsLoading(true)
    setYear(newYear)
    try {
      const newData = await getDreData(newYear)
      setData(newData)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleRow = (rowId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }))
  }

  const groupedData = useMemo(() => {
    const result: {
      IN: Record<string, { label: string, values: number[], transactions: TransactionWithRelations[][] }>
      OUT: Record<string, { label: string, values: number[], transactions: TransactionWithRelations[][] }>
      net: number[]
    } = {
      IN: {},
      OUT: {},
      net: Array(12).fill(0)
    }

    // Initialize dimensions
    const dims = groupBy === "CATEGORY" ? data.categories : 
                 groupBy === "ACCOUNT" ? data.accounts : 
                 data.paymentMethods

    dims.forEach(dim => {
      result.IN[dim.id] = { label: dim.name, values: Array(12).fill(0), transactions: Array.from({ length: 12 }, () => []) }
      result.OUT[dim.id] = { label: dim.name, values: Array(12).fill(0), transactions: Array.from({ length: 12 }, () => []) }
    })

    // Catch-all for deleted or null relations
    const otherLabel = t("other")
    result.IN["other"] = { label: otherLabel, values: Array(12).fill(0), transactions: Array.from({ length: 12 }, () => []) }
    result.OUT["other"] = { label: otherLabel, values: Array(12).fill(0), transactions: Array.from({ length: 12 }, () => []) }

    data.transactions.forEach(tx => {
      const date = new Date(tx.issueDate)
      const monthIdx = date.getMonth()
      const direction = tx.direction as "IN" | "OUT"
      
      let dimId = "other"
      if (groupBy === "CATEGORY") dimId = tx.categoryId.toString()
      else if (groupBy === "ACCOUNT") dimId = tx.accountId?.toString() || "other"
      else if (groupBy === "PAYMENT_METHOD") dimId = tx.paymentMethodId?.toString() || "other"

      if (result[direction][dimId]) {
        result[direction][dimId].values[monthIdx] += tx.amountCents
        result[direction][dimId].transactions[monthIdx].push(tx)
      } else {
        result[direction]["other"].values[monthIdx] += tx.amountCents
        result[direction]["other"].transactions[monthIdx].push(tx)
      }

      if (direction === "IN") {
        result.net[monthIdx] += tx.amountCents
      } else {
        result.net[monthIdx] -= tx.amountCents
      }
    })

    // Filter out rows with all zeros
    const filterEmpty = (obj: Record<string, any>) => {
      return Object.fromEntries(
        Object.entries(obj).filter(([_, val]) => val.values.some((v: number) => v !== 0))
      )
    }

    return {
      IN: filterEmpty(result.IN),
      OUT: filterEmpty(result.OUT),
      net: result.net
    }
  }, [data, groupBy, t])

  const totals = useMemo(() => {
    const result = {
      IN: Array(12).fill(0),
      OUT: Array(12).fill(0)
    }
    Object.values(groupedData.IN).forEach(row => {
      row.values.forEach((v: number, i: number) => result.IN[i] += v)
    })
    Object.values(groupedData.OUT).forEach(row => {
      row.values.forEach((v: number, i: number) => result.OUT[i] += v)
    })
    return result
  }, [groupedData])

  return (
    <div className="flex flex-col h-full gap-4 md:gap-6 overflow-hidden">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="hidden md:block text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year Select */}
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-[80px] md:w-[100px]" disabled={isLoading}>
                  {year} <ChevronDown className="ml-1 h-3 w-3 md:ml-2 md:h-4 md:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {years.map(y => (
                  <DropdownMenuItem key={y} onClick={() => handleYearChange(y)}>
                    {y}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Group By Select */}
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-[120px] md:w-[180px]" disabled={isLoading}>
                  <span className="truncate">{t(`groupOptions.${groupBy}`)}</span> <ChevronDown className="ml-1 h-3 w-3 md:ml-2 md:h-4 md:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setGroupBy("CATEGORY")}>
                  {t("groupOptions.CATEGORY")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("ACCOUNT")}>
                  {t("groupOptions.ACCOUNT")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("PAYMENT_METHOD")}>
                  {t("groupOptions.PAYMENT_METHOD")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {isMobile ? (
        <DREMobile 
          months={months}
          groupedData={groupedData}
          totals={totals}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          locale={locale}
          expandedRows={expandedRows}
          toggleRow={toggleRow}
          t={t}
        />
      ) : (
        <div className="flex-1 overflow-auto rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 bg-card z-10 w-[200px] min-w-[200px]">{t("category")}</TableHead>
                {months.map((month, i) => (
                  <TableHead key={i} className="text-right min-w-[120px]">{month}</TableHead>
                ))}
                <TableHead className="text-right font-bold bg-muted/30 min-w-[140px]">{t("total")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* INCOME SECTION */}
              <TableRow className="bg-muted/50 font-bold hover:bg-muted/70 cursor-pointer" onClick={() => toggleRow("income-section")}>
                <TableCell className="sticky left-0 bg-inherit z-10 flex items-center gap-2 py-3">
                  {expandedRows["income-section"] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {t("income")}
                </TableCell>
                {months.map((_, i) => (
                  <TableCell key={i} className="text-right text-green-600 dark:text-green-400">
                    {formatCurrency(totals.IN[i], locale)}
                  </TableCell>
                ))}
                <TableCell className="text-right bg-muted/30 text-green-600 dark:text-green-400">
                  {formatCurrency(totals.IN.reduce((a, b) => a + b, 0), locale)}
                </TableCell>
              </TableRow>

              {expandedRows["income-section"] && Object.entries(groupedData.IN).map(([id, row]) => (
                <Fragment key={id}>
                  <TableRow key={id} className="hover:bg-muted/30 cursor-pointer" onClick={() => toggleRow(`IN-${id}`)}>
                    <TableCell className="sticky left-0 bg-card z-10 pl-8 flex items-center gap-2">
                      {expandedRows[`IN-${id}`] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      {row.label}
                    </TableCell>
                    {row.values.map((val: number, i: number) => (
                      <TableCell key={i} className="text-right text-sm">
                        {val > 0 ? formatCurrency(val, locale) : "-"}
                      </TableCell>
                    ))}
                    <TableCell className="text-right bg-muted/20 text-sm font-medium">
                      {formatCurrency(row.values.reduce((a: number, b: number) => a + b, 0), locale)}
                    </TableCell>
                  </TableRow>
                  {expandedRows[`IN-${id}`] && (
                    <TableRow className="bg-muted/5 hover:bg-muted/5">
                      <TableCell className="sticky left-0 bg-card z-10 border-b-0" />
                      {row.transactions.map((monthTxs: TransactionWithRelations[], i: number) => (
                        <TableCell key={i} className="align-top p-1 border-x border-muted/20">
                          <MonthTransactionList 
                            transactions={monthTxs}
                            locale={locale}
                            formatCurrency={formatCurrency}
                            formatDate={formatDate}
                            isIncome={true}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="bg-muted/30 border-l border-muted/20" />
                    </TableRow>
                  )}
                </Fragment>
              ))}

              {/* EXPENSE SECTION */}
              <TableRow className="bg-muted/50 font-bold hover:bg-muted/70 cursor-pointer" onClick={() => toggleRow("expense-section")}>
                <TableCell className="sticky left-0 bg-inherit z-10 flex items-center gap-2 py-3">
                  {expandedRows["expense-section"] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {t("expense")}
                </TableCell>
                {months.map((_, i) => (
                  <TableCell key={i} className="text-right text-red-600 dark:text-red-400">
                    {formatCurrency(totals.OUT[i], locale)}
                  </TableCell>
                ))}
                <TableCell className="text-right bg-muted/30 text-red-600 dark:text-red-400">
                  {formatCurrency(totals.OUT.reduce((a, b) => a + b, 0), locale)}
                </TableCell>
              </TableRow>

              {expandedRows["expense-section"] && Object.entries(groupedData.OUT).map(([id, row]) => (
                <Fragment key={id}>
                  <TableRow key={id} className="hover:bg-muted/30 cursor-pointer" onClick={() => toggleRow(`OUT-${id}`)}>
                    <TableCell className="sticky left-0 bg-card z-10 pl-8 flex items-center gap-2">
                      {expandedRows[`OUT-${id}`] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      {row.label}
                    </TableCell>
                    {row.values.map((val: number, i: number) => (
                      <TableCell key={i} className="text-right text-sm">
                        {val > 0 ? formatCurrency(val, locale) : "-"}
                      </TableCell>
                    ))}
                    <TableCell className="text-right bg-muted/20 text-sm font-medium">
                      {formatCurrency(row.values.reduce((a: number, b: number) => a + b, 0), locale)}
                    </TableCell>
                  </TableRow>
                  {expandedRows[`OUT-${id}`] && (
                    <TableRow className="bg-muted/5 hover:bg-muted/5">
                      <TableCell className="sticky left-0 bg-card z-10 border-b-0" />
                      {row.transactions.map((monthTxs: TransactionWithRelations[], i: number) => (
                        <TableCell key={i} className="align-top p-1 border-x border-muted/20">
                          <MonthTransactionList 
                            transactions={monthTxs}
                            locale={locale}
                            formatCurrency={formatCurrency}
                            formatDate={formatDate}
                            isIncome={false}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="bg-muted/30 border-l border-muted/20" />
                    </TableRow>
                  )}
                </Fragment>
              ))}

              {/* NET PROFIT */}
              <TableRow className="bg-muted font-bold hover:bg-muted border-t-2">
                <TableCell className="sticky left-0 bg-inherit z-10 py-4">{t("netProfit")}</TableCell>
                {months.map((_, i) => (
                  <TableCell key={i} className={`text-right ${groupedData.net[i] >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {formatCurrency(groupedData.net[i], locale)}
                  </TableCell>
                ))}
                <TableCell className={`text-right bg-muted/30 ${groupedData.net.reduce((a, b) => a + b, 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {formatCurrency(groupedData.net.reduce((a, b) => a + b, 0), locale)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// Adding a helper for a single month's desktop transactions
function MonthTransactionList({ 
  transactions, 
  locale, 
  formatCurrency, 
  formatDate, 
  isIncome 
}: { 
  transactions: TransactionWithRelations[], 
  locale: string, 
  formatCurrency: (cents: number, loc: string) => string, 
  formatDate: (date: Date | string, loc: string) => string, 
  isIncome: boolean
}) {
  if (transactions.length === 0) return null;

  return (
    <div className="space-y-1.5 py-2">
      {transactions.map(tx => (
        <div 
          key={tx.id} 
          className="group p-1.5 rounded border bg-background hover:border-primary/50 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-sm"
        >
          <div className="flex flex-col gap-0.5">
            <div className="flex items-start justify-between gap-1">
              <span className="font-semibold text-[9px] leading-tight truncate flex-1" title={tx.description}>
                {tx.description}
              </span>
              <span className={`text-[9px] font-bold shrink-0 ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(tx.amountCents, locale)}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-1 mt-0.5 opacity-70">
              <span className="text-[8px] text-muted-foreground whitespace-nowrap">
                {formatDate(tx.issueDate, locale)}
              </span>
              {tx.account && (
                <div className="flex items-center text-[8px] text-muted-foreground truncate max-w-[50px]">
                  <Wallet className="h-2 w-2 mr-0.5 shrink-0" />
                  <span className="truncate">{tx.account.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface DREMobileProps {
  months: string[]
  groupedData: any
  totals: any
  formatCurrency: (cents: number, loc: string) => string
  formatDate: (date: Date | string, loc: string) => string
  locale: string
  expandedRows: Record<string, boolean>
  toggleRow: (id: string) => void
  t: any
}

function DREMobile({ 
  months, 
  groupedData, 
  totals, 
  formatCurrency, 
  formatDate, 
  locale, 
  expandedRows, 
  toggleRow, 
  t 
}: DREMobileProps) {
  const currentMonthIdx = new Date().getMonth()
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIdx)

  const incomeRows = Object.entries(groupedData.IN)
  const expenseRows = Object.entries(groupedData.OUT)

  return (
    <div className="flex flex-col gap-4 overflow-hidden h-full pb-4">
      {/* Horizontal Month Selector */}
      <div className="w-full pb-2 overflow-x-auto no-scrollbar flex gap-2">
        {months.map((month, i) => (
          <Button
            key={i}
            variant={selectedMonth === i ? "default" : "outline"}
            size="sm"
            className="px-6 rounded-full flex-shrink-0"
            onClick={() => setSelectedMonth(i)}
          >
            {month}
          </Button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-xl border border-green-100 dark:border-green-950/50 bg-green-50/30 dark:bg-green-950/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">{t("income")}</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(totals.IN[selectedMonth], locale)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-red-100 dark:border-red-950/50 bg-red-50/30 dark:bg-red-950/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">{t("expense")}</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(totals.OUT[selectedMonth], locale)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">{t("netProfit")}</p>
                  <p className={`text-lg font-bold ${groupedData.net[selectedMonth] >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {formatCurrency(groupedData.net[selectedMonth], locale)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Lists */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2 px-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                {t("income")}
              </h3>
              <div className="space-y-2">
                {incomeRows.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic px-1">{t("noTransactions")}</p>
                ) : (
                  incomeRows.map(([id, row]: [string, any]) => (
                    <div key={id} className="rounded-lg border bg-card overflow-hidden">
                      <button 
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                        onClick={() => toggleRow(`mobile-IN-${id}`)}
                      >
                        <div className="flex items-center gap-2">
                          {expandedRows[`mobile-IN-${id}`] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="text-sm font-medium">{row.label}</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(row.values[selectedMonth], locale)}
                        </span>
                      </button>
                      
                      {expandedRows[`mobile-IN-${id}`] && (
                        <div className="border-t bg-muted/20 p-2 space-y-2">
                          {row.transactions[selectedMonth].length === 0 ? (
                            <p className="text-[10px] text-muted-foreground italic p-2 text-center">{t("noTransactions")}</p>
                          ) : (
                            row.transactions[selectedMonth].map((tx: any) => (
                              <div key={tx.id} className="flex items-center justify-between p-2 bg-background rounded border text-[10px]">
                                <div>
                                  <p className="font-medium">{tx.description}</p>
                                  <p className="text-muted-foreground">{formatDate(tx.issueDate, locale)}</p>
                                </div>
                                <span className="font-semibold text-green-600">{formatCurrency(tx.amountCents, locale)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2 px-1 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                {t("expense")}
              </h3>
              <div className="space-y-2">
                {expenseRows.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic px-1">{t("noTransactions")}</p>
                ) : (
                  expenseRows.map(([id, row]: [string, any]) => (
                    <div key={id} className="rounded-lg border bg-card overflow-hidden">
                      <button 
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                        onClick={() => toggleRow(`mobile-OUT-${id}`)}
                      >
                        <div className="flex items-center gap-2">
                          {expandedRows[`mobile-OUT-${id}`] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="text-sm font-medium">{row.label}</span>
                        </div>
                        <span className="text-sm font-bold text-red-600">
                          {formatCurrency(row.values[selectedMonth], locale)}
                        </span>
                      </button>
                      
                      {expandedRows[`mobile-OUT-${id}`] && (
                        <div className="border-t bg-muted/20 p-2 space-y-2">
                          {row.transactions[selectedMonth].length === 0 ? (
                            <p className="text-[10px] text-muted-foreground italic p-2 text-center">{t("noTransactions")}</p>
                          ) : (
                            row.transactions[selectedMonth].map((tx: any) => (
                              <div key={tx.id} className="flex items-center justify-between p-2 bg-background rounded border text-[10px]">
                                <div>
                                  <p className="font-medium">{tx.description}</p>
                                  <p className="text-muted-foreground">{formatDate(tx.issueDate, locale)}</p>
                                </div>
                                <span className="font-semibold text-red-600">{formatCurrency(tx.amountCents, locale)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
