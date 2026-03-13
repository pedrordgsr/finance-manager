"use client"

import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown, Languages } from "lucide-react"

const languages = [
  { code: "en", name: "English" },
  { code: "pt", name: "Português" },
]

export function LanguageSelector() {
  const t = useTranslations("settings")
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const currentLanguage = languages.find((l) => l.code === locale) || languages[0]

  const changeLocale = (newLocale: string) => {
    startTransition(() => {
      // Store locale preference
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
      
      // Refresh to apply new locale
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between" disabled={isPending}>
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 opacity-50" />
            {currentLanguage.name}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLocale(lang.code)}
            className="flex justify-between"
          >
            {lang.name}
            {locale === lang.code && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
