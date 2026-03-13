"use client"

import { useSettings } from "@/components/settings-provider"
import { useTranslations } from "next-intl"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const currencies = [
  { code: "BRL", name: "Real (BRL)", symbol: "R$" },
  { code: "USD", name: "Dollar (USD)", symbol: "$" },
  { code: "EUR", name: "Euro (EUR)", symbol: "€" },
  { code: "GBP", name: "Pound (GBP)", symbol: "£" },
  { code: "JPY", name: "Yen (JPY)", symbol: "¥" },
]

export function CurrencySelector() {
  const { settings, updateSettings } = useSettings()
  const t = useTranslations("settings")

  const currentCurrency = currencies.find((c) => c.code === settings.currency) || currencies[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          {currentCurrency.name}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        {currencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => updateSettings({ currency: currency.code })}
            className="flex justify-between"
          >
            {currency.name}
            {settings.currency === currency.code && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
