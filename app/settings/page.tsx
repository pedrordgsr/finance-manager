"use client"

import { useTranslations } from "next-intl"
import { CurrencySelector } from "@/components/currency-selector"
import { LanguageSelector } from "@/components/language-selector"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const t = useTranslations("settings")

  return (
    <div className="flex flex-col gap-6 p-4 pt-0 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("appearance")}</p>
      </div>

      <Separator />

      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{t("currency")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("currencyDescription")}
          </p>
          <div className="mt-2">
            <CurrencySelector />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{t("language")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("languageDescription")}
          </p>
          <div className="mt-2">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </div>
  )
}
