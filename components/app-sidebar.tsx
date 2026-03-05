"use client"

import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/ui/theme-toggle"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { Receipt, FolderOpen, CreditCard, Wallet } from "lucide-react"
import { useTranslations } from 'next-intl'

export function AppSidebar() {
  const t = useTranslations('sidebar')

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex h-12 w-full items-center px-4 font-semibold">
          {t('appName')}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('movements')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/transactions">
                    <Receipt />
                    <span>{t('transactions')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('registers')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/categories">
                    <FolderOpen />
                    <span>{t('categories')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/accounts">
                    <Wallet />
                    <span>{t('accounts')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/payment-methods">
                    <CreditCard />
                    <span>{t('paymentMethods')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 flex gap-2">
          <ModeToggle />
          <LanguageToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
