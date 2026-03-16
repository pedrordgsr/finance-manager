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
  CreditCard,
  Target
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
import { getDreData, updateBudget } from "./actions"
import type { Category, Account, PaymentMethod, Transaction, Budget } from "@/generated/prisma/client"

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
    budgets: Budget[]
  }
  currentYear: number
}

type GroupByOption = "CATEGORY" | "ACCOUNT" | "PAYMENT_METHOD"
type ViewMode = "ACTUAL" | "BUDGET" | "BOTH"

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
  const [viewMode, setViewMode] = useState<ViewMode>("ACTUAL")
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
      IN: Record<string, { label: string, values: number[], budgets: number[], transactions: TransactionWithRelations[][] }>
      OUT: Record<string, { label: string, values: number[], budgets: number[], transactions: TransactionWithRelations[][] }>
      net: number[]
      netBudgets: number[]
    } = {
      IN: {},
      OUT: {},
      net: Array(12).fill(0),
      netBudgets: Array(12).fill(0)
    }

    // Initialize dimensions
    const dims = groupBy === "CATEGORY" ? data.categories : 
                 groupBy === "ACCOUNT" ? data.accounts : 
                 data.paymentMethods

    dims.forEach(dim => {
      const dimBudgets = Array(12).fill(0)
      if (groupBy === "CATEGORY") {
        data.budgets.filter(b => b.categoryId === dim.id).forEach(b => {
          dimBudgets[b.month] = b.amountCents
        })
      }
      result.IN[dim.id] = { label: dim.name, values: Array(12).fill(0), budgets: dimBudgets, transactions: Array.from({ length: 12 }, () => []) }
      result.OUT[dim.id] = { label: dim.name, values: Array(12).fill(0), budgets: dimBudgets, transactions: Array.from({ length: 12 }, () => []) }
    })

    // Catch-all for deleted or null relations
    const otherLabel = t("other")
    result.IN["other"] = { label: otherLabel, values: Array(12).fill(0), budgets: Array(12).fill(0), transactions: Array.from({ length: 12 }, () => []) }
    result.OUT["other"] = { label: otherLabel, values: Array(12).fill(0), budgets: Array(12).fill(0), transactions: Array.from({ length: 12 }, () => []) }

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

    // Calculate net budgets
    if (groupBy === "CATEGORY") {
      Object.entries(result.IN).forEach(([_, row]) => {
        row.budgets.forEach((v, i) => result.netBudgets[i] += v)
      })
      Object.entries(result.OUT).forEach(([_, row]) => {
        row.budgets.forEach((v, i) => result.netBudgets[i] -= v)
      })
    }

    return {
      IN: filterEmpty(result.IN),
      OUT: filterEmpty(result.OUT),
      net: result.net,
      netBudgets: result.netBudgets
    }
  }, [data, groupBy, t])

  const totals = useMemo(() => {
    const result = {
      IN: Array(12).fill(0),
      OUT: Array(12).fill(0),
      budgetIN: Array(12).fill(0),
      budgetOUT: Array(12).fill(0)
    }
    Object.values(groupedData.IN).forEach(row => {
      row.values.forEach((v: number, i: number) => result.IN[i] += v)
      row.budgets.forEach((v: number, i: number) => result.budgetIN[i] += v)
    })
    Object.values(groupedData.OUT).forEach(row => {
      row.values.forEach((v: number, i: number) => result.OUT[i] += v)
      row.budgets.forEach((v: number, i: number) => result.budgetOUT[i] += v)
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

          {/* View Mode Select (Desktop only) */}
          {!isMobile && (
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
              {(["ACTUAL", "BUDGET", "BOTH"] as ViewMode[]).map((v) => (
                <Button
                  key={v}
                  variant={viewMode === v ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => setViewMode(v)}
                >
                  {t(`views.${v}`)}
                </Button>
              ))}
            </div>
          )}
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
            year={year}
            setData={setData}
          />
      ) : (
        <div className="flex-1 overflow-auto rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 bg-card z-10 w-[200px] min-w-[200px]">{t("category")}</TableHead>
                {months.map((month, i) => (
                  <TableHead 
                    key={i} 
                    className="text-right min-w-[120px]" 
                    colSpan={viewMode === "BOTH" ? 2 : 1}
                  >
                    <div className="flex flex-col items-end">
                      <span>{month}</span>
                      {viewMode === "BOTH" && (
                        <div className="flex gap-4 text-[10px] font-normal text-muted-foreground mt-1">
                          <span>{t("views.ACTUAL")}</span>
                          <span>{t("views.BUDGET")}</span>
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
                <TableHead 
                  className="text-right font-bold bg-muted/30 min-w-[140px]"
                  colSpan={viewMode === "BOTH" ? 2 : 1}
                >
                  <div className="flex flex-col items-end">
                    <span>{t("total")}</span>
                    {viewMode === "BOTH" && (
                      <div className="flex gap-4 text-[10px] font-normal text-muted-foreground mt-1">
                        <span>{t("views.ACTUAL")}</span>
                        <span>{t("views.BUDGET")}</span>
                      </div>
                    )}
                  </div>
                </TableHead>
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
                  <Fragment key={i}>
                    {(viewMode === "ACTUAL" || viewMode === "BOTH") && (
                      <TableCell className="text-right text-green-600 dark:text-green-400">
                        {formatCurrency(totals.IN[i], locale)}
                      </TableCell>
                    )}
                    {(viewMode === "BUDGET" || viewMode === "BOTH") && (
                      <TableCell className="text-right text-muted-foreground italic font-normal">
                        {formatCurrency(totals.budgetIN[i], locale)}
                      </TableCell>
                    )}
                  </Fragment>
                ))}
                <Fragment>
                  {(viewMode === "ACTUAL" || viewMode === "BOTH") && (
                    <TableCell className="text-right bg-muted/30 text-green-600 dark:text-green-400">
                      {formatCurrency(totals.IN.reduce((a: number, b: number) => a + b, 0), locale)}
                    </TableCell>
                  )}
                  {(viewMode === "BUDGET" || viewMode === "BOTH") && (
                    <TableCell className="text-right bg-muted/30 text-muted-foreground italic font-normal text-sm">
                      {formatCurrency(totals.budgetIN.reduce((a: number, b: number) => a + b, 0), locale)}
                    </TableCell>
                  )}
                </Fragment>
              </TableRow>

              {expandedRows["income-section"] && Object.entries(groupedData.IN).map(([id, row]) => (
                <Fragment key={id}>
                  <TableRow key={id} className="hover:bg-muted/30 cursor-pointer" onClick={() => toggleRow(`IN-${id}`)}>
                    <TableCell className="sticky left-0 bg-card z-10 pl-8 flex items-center gap-2 group">
                      {expandedRows[`IN-${id}`] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      <span className="flex-1 truncate">{row.label}</span>
                      {groupBy === "CATEGORY" && id !== "other" && (
                        <BudgetDialog 
                          categoryId={parseInt(id)}
                          categoryName={row.label}
                          year={year}
                          initialBudgets={row.budgets}
                          onSave={async (newBudgets: number[]) => {
                            await Promise.all(newBudgets.map((val: number, idx: number) => updateBudget(parseInt(id), idx, year, val)))
                            const newData = await getDreData(year)
                            setData(newData)
                          }}
                          formatCurrency={formatCurrency}
                          locale={locale}
                          t={t}
                        />
                      )}
                    </TableCell>
                    {row.values.map((val: number, i: number) => (
                      <Fragment key={i}>
                        {(viewMode === "ACTUAL" || viewMode === "BOTH") && (
                          <TableCell className="text-right text-sm">
                            {val > 0 ? formatCurrency(val, locale) : "-"}
                          </TableCell>
                        )}
                        {(viewMode === "BUDGET" || viewMode === "BOTH") && (
                          <TableCell className="text-right text-sm text-muted-foreground italic">
                            {row.budgets[i] > 0 ? formatCurrency(row.budgets[i], locale) : "-"}
                          </TableCell>
                        )}
                      </Fragment>
                    ))}
                    <Fragment>
                      {(viewMode === "ACTUAL" || viewMode === "BOTH") && (
                        <TableCell className="text-right bg-muted/20 text-sm font-medium">
                          {formatCurrency(row.values.reduce((a: number, b: number) => a + b, 0), locale)}
                        </TableCell>
                      )}
                      {(viewMode === "BUDGET" || viewMode === "BOTH") && (
                        <TableCell className="text-right bg-muted/20 text-sm text-muted-foreground italic">
                          {formatCurrency(row.budgets.reduce((a: number, b: number) => a + b, 0), locale)}
                        </TableCell>
                      )}
                    </Fragment>
                  </TableRow>
                  {expandedRows[`IN-${id}`] && (
                    <TableRow className="bg-muted/5 hover:bg-muted/5">
                      <TableCell className="sticky left-0 bg-card z-10 border-b-0" />
                      {row.transactions.map((monthTxs: TransactionWithRelations[], i: number) => (
                        <TableCell 
                          key={i} 
                          className="align-top p-1 border-x border-muted/20"
                          colSpan={viewMode === "BOTH" ? 2 : 1}
                        >
                          <MonthTransactionList 
                            transactions={monthTxs}
                            locale={locale}
                            formatCurrency={formatCurrency}
                            formatDate={formatDate}
                            isIncome={true}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="bg-muted/30 border-l border-muted/20" colSpan={viewMode === "BOTH" ? 2 : 1} />
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
                  <Fragment key={i}>
                    {(viewMode === "ACTUAL" || viewMode === "BOTH") && (
                      <TableCell className="text-right text-red-600 dark:text-red-400">
                        {formatCurrency(totals.OUT[i], locale)}
                      </TableCell>
                    )}
                    {(viewMode === "BUDGET" || viewMode === "BOTH") && (
                      <TableCell className="text-right text-muted-foreground italic font-normal">
                        {formatCurrency(totals.budgetOUT[i], locale)}
                      </TableCell>
                    )}
                  </Fragment>
                ))}
                <Fragment>
                  {(viewMode === "ACTUAL" || viewMode === "BOTH") && (
                    <TableCell className="text-right bg-muted/30 text-red-600 dark:text-red-400">
                      {formatCurrency(totals.OUT.reduce((a: number, b: number) => a + b, 0), locale)}
                    </TableCell>
                  )}
                  {(viewMode === "BUDGET" || viewMode === "BOTH") && (
                    <TableCell className="text-right bg-muted/30 text-muted-foreground italic font-normal text-sm">
                      {formatCurrency(totals.budgetOUT.reduce((a: number, b: number) => a + b, 0), locale)}
                    </TableCell>
                  )}
                </Fragment>
              </TableRow>

              {expandedRows["expense-section"] && Object.entries(groupedData.OUT).map(([id, row]) => (
                <Fragment key={id}>
                  <TableRow key={id} className="hover:bg-muted/30 cursor-pointer" onClick={() => toggleRow(`OUT-${id}`)}>
                    <TableCell className="sticky left-0 bg-card z-10 pl-8 flex items-center gap-2 group">
                      {expandedRows[`OUT-${id}`] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      <span className="flex-1 truncate">{row.label}</span>
                      {groupBy === "CATEGORY" && id !== "other" && (
                        <BudgetDialog 
                          categoryId={parseInt(id)}
                          categoryName={row.label}
                          year={year}
                          initialBudgets={row.budgets}
                          onSave={async (newBudgets: number[]) => {
                            await Promise.all(newBudgets.map((val: number, idx: number) => updateBudget(parseInt(id), idx, year, val)))
                            const newData = await getDreData(year)
                            setData(newData)
                          }}
                          formatCurrency={formatCurrency}
                          locale={locale}
                          t={t}
                        />
                      )}
                    </TableCell>
                    {row.values.map((val: number, i: number) => (
                      <Fragment key={i}>
                        {(viewMode === "ACTUAL" || viewMode === "BOTH") && (
                          <TableCell className="text-right text-sm">
                            {val > 0 ? formatCurrency(val, locale) : "-"}
                          </TableCell>
                        )}
                        {(viewMode === "BUDGET" || viewMode === "BOTH") && (
                          <TableCell className="text-right text-sm text-muted-foreground italic">
                            {row.budgets[i] > 0 ? formatCurrency(row.budgets[i], locale) : "-"}
                          </TableCell>
                        )}
                      </Fragment>
                    ))}
                    <Fragment>
                      {(viewMode === "ACTUAL" || viewMode === "BOTH") && (
                        <TableCell className="text-right bg-muted/20 text-sm font-medium">
                          {formatCurrency(row.values.reduce((a: number, b: number) => a + b, 0), locale)}
                        </TableCell>
                      )}
                      {(viewMode === "BUDGET" || viewMode === "BOTH") && (
                        <TableCell className="text-right bg-muted/20 text-sm text-muted-foreground italic">
                          {formatCurrency(row.budgets.reduce((a: number, b: number) => a + b, 0), locale)}
                        </TableCell>
                      )}
                    </Fragment>
                  </TableRow>
                  {expandedRows[`OUT-${id}`] && (
                    <TableRow className="bg-muted/5 hover:bg-muted/5">
                      <TableCell className="sticky left-0 bg-card z-10 border-b-0" />
                      {row.transactions.map((monthTxs: TransactionWithRelations[], i: number) => (
                        <TableCell 
                          key={i} 
                          className="align-top p-1 border-x border-muted/20"
                          colSpan={viewMode === "BOTH" ? 2 : 1}
                        >
                          <MonthTransactionList 
                            transactions={monthTxs}
                            locale={locale}
                            formatCurrency={formatCurrency}
                            formatDate={formatDate}
                            isIncome={false}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="bg-muted/30 border-l border-muted/20" colSpan={viewMode === "BOTH" ? 2 : 1} />
                    </TableRow>
                  )}
                </Fragment>
              ))}

              {/* NET PROFIT */}
              <TableRow className="bg-muted font-bold hover:bg-muted border-t-2">
                <TableCell className="sticky left-0 bg-inherit z-10 py-4">{t("netProfit")}</TableCell>
                {months.map((_, i) => (
                  <Fragment key={i}>
                    {(viewMode === "ACTUAL" || viewMode === "BOTH") && (
                      <TableCell className={`text-right ${groupedData.net[i] >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {formatCurrency(groupedData.net[i], locale)}
                      </TableCell>
                    )}
                    {(viewMode === "BUDGET" || viewMode === "BOTH") && (
                      <TableCell className={`text-right text-muted-foreground italic font-normal ${groupedData.netBudgets[i] >= 0 ? "text-green-600/70" : "text-red-600/70"}`}>
                        {formatCurrency(groupedData.netBudgets[i], locale)}
                      </TableCell>
                    )}
                  </Fragment>
                ))}
                <Fragment>
                  {(viewMode === "ACTUAL" || viewMode === "BOTH") && (
                    <TableCell className={`text-right bg-muted/30 ${groupedData.net.reduce((a: number, b: number) => a + b, 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {formatCurrency(groupedData.net.reduce((a: number, b: number) => a + b, 0), locale)}
                    </TableCell>
                  )}
                  {(viewMode === "BUDGET" || viewMode === "BOTH") && (
                    <TableCell className={`text-right bg-muted/30 text-muted-foreground italic font-normal text-sm ${groupedData.netBudgets.reduce((a: number, b: number) => a + b, 0) >= 0 ? "text-green-600/70" : "text-red-600/70"}`}>
                      {formatCurrency(groupedData.netBudgets.reduce((a: number, b: number) => a + b, 0), locale)}
                    </TableCell>
                  )}
                </Fragment>
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
  year: number
  setData: (data: any) => void
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
  t,
  year,
  setData
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
                  {groupedData.netBudgets[selectedMonth] !== 0 && (
                    <p className="text-[10px] text-muted-foreground italic">
                      {t("budgetShort")}: {formatCurrency(groupedData.netBudgets[selectedMonth], locale)}
                    </p>
                  )}
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
                      <div 
                        className="w-full p-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => toggleRow(`mobile-IN-${id}`)}
                      >
                        <div className="flex items-center gap-2">
                          {expandedRows[`mobile-IN-${id}`] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="text-sm font-medium">{row.label}</span>
                          {id !== "other" && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <BudgetDialog 
                                categoryId={parseInt(id)}
                                categoryName={row.label}
                                year={year}
                                initialBudgets={row.budgets}
                                onSave={async (newBudgets: number[]) => {
                                  await Promise.all(newBudgets.map((val: number, idx: number) => updateBudget(parseInt(id), idx, year, val)))
                                  const newData = await getDreData(year)
                                  setData(newData)
                                }}
                                formatCurrency={formatCurrency}
                                locale={locale}
                                t={t}
                              />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(row.values[selectedMonth], locale)}
                        </span>
                      </div>
                      
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
                      <div 
                        className="w-full p-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => toggleRow(`mobile-OUT-${id}`)}
                      >
                        <div className="flex items-center gap-2">
                          {expandedRows[`mobile-OUT-${id}`] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="text-sm font-medium">{row.label}</span>
                          {id !== "other" && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <BudgetDialog 
                                categoryId={parseInt(id)}
                                categoryName={row.label}
                                year={year}
                                initialBudgets={row.budgets}
                                onSave={async (newBudgets: number[]) => {
                                  await Promise.all(newBudgets.map((val: number, idx: number) => updateBudget(parseInt(id), idx, year, val)))
                                  const newData = await getDreData(year)
                                  setData(newData)
                                }}
                                formatCurrency={formatCurrency}
                                locale={locale}
                                t={t}
                              />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-bold text-red-600">
                          {formatCurrency(row.values[selectedMonth], locale)}
                        </span>
                      </div>
                      
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

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function BudgetDialog({ 
  categoryId, 
  categoryName, 
  year, 
  initialBudgets, 
  onSave,
  formatCurrency,
  locale,
  t
}: { 
  categoryId: number, 
  categoryName: string, 
  year: number, 
  initialBudgets: number[], 
  onSave: (budgets: number[]) => Promise<void>,
  formatCurrency: (cents: number, loc: string) => string,
  locale: string,
  t: any
}) {
  const [budgets, setBudgets] = useState<string[]>(initialBudgets.map(v => (v / 100).toString()))
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const numericBudgets = budgets.map(v => Math.round(parseFloat(v || "0") * 100))
      await onSave(numericBudgets)
      setIsOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <Target className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("budgetFor", { name: categoryName, year })}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {Array.from({ length: 12 }).map((_, i) => {
            const date = new Date(year, i, 1)
            const monthName = new Intl.DateTimeFormat(locale, { month: "long" }).format(date)
            return (
              <div key={i} className="flex flex-col gap-1.5">
                <Label htmlFor={`month-${i}`} className="capitalize">{monthName}</Label>
                <Input 
                  id={`month-${i}`}
                  type="number"
                  step="0.01"
                  value={budgets[i]}
                  onChange={(e) => {
                    const newBudgets = [...budgets]
                    newBudgets[i] = e.target.value
                    setBudgets(newBudgets)
                  }}
                  disabled={isSaving}
                />
              </div>
            )
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
