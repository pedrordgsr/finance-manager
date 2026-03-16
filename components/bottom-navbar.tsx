"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Receipt, BarChart3, PlusCircle, Settings, FolderOpen, Wallet, CreditCard } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"


export function BottomNavbar() {
  const t = useTranslations("sidebar")
  const pathname = usePathname()

  const navItems = [
    {
      label: t("home"),
      href: "/",
      icon: Home,
    },
    {
      label: t("transactions"),
      href: "/transactions",
      icon: Receipt,
    },
    {
      label: t("settings"),
      href: "/settings",
      icon: Settings,
    },
  ]

  const registerItems = [
    {
      label: t("categories"),
      href: "/categories",
      icon: FolderOpen,
    },
    {
      label: t("accounts"),
      href: "/accounts",
      icon: Wallet,
    },
    {
      label: t("paymentMethods"),
      href: "/payment-methods",
      icon: CreditCard,
    },
  ]

  const reportItems = [
    {
      label: t("dre"),
      href: "/reports/dre",
      icon: BarChart3,
    },
    {
      label: t("payablesReceivables"),
      href: "/reports/payables-receivables",
      icon: Receipt,
    },
  ]

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 md:hidden">
      <nav className="flex items-center gap-1 rounded-full border bg-background/80 p-2 shadow-lg backdrop-blur-md">
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-6 w-6" />
            </Link>
          )
        })}

        <Sheet>
          <SheetTrigger asChild>
            <button className="flex h-12 w-12 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted">
              <PlusCircle className="h-6 w-6" />
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-[2rem] p-6">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-center">Registros</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-4 py-4">
              {registerItems.map((item) => (
                <SheetClose key={item.href} asChild>
                  <Link
                    href={item.href}
                    className="flex flex-col items-center gap-2 rounded-2xl p-4 transition-colors hover:bg-muted"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <span className="text-center text-xs font-medium">{item.label}</span>
                  </Link>
                </SheetClose>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger asChild>
            <button 
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                pathname.startsWith("/reports")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <BarChart3 className="h-6 w-6" />
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-[2rem] p-6">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-center">Relatórios</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              {reportItems.map((item) => (
                <SheetClose key={item.href} asChild>
                  <Link
                    href={item.href}
                    className="flex flex-col items-center gap-2 rounded-2xl p-4 transition-colors hover:bg-muted"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <span className="text-center text-xs font-medium">{item.label}</span>
                  </Link>
                </SheetClose>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        {navItems.slice(2).map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-6 w-6" />
            </Link>
          )
        })}

      </nav>
    </div>
  )
}
