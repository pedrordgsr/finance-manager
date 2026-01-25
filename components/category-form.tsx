"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui/field"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type CategoryKind = "IN" | "OUT" | "BOTH"

interface CategoryFormProps {
  onSuccess?: () => void
}

export function CategoryForm({ onSuccess }: CategoryFormProps) {
  const t = useTranslations("categories")
  const router = useRouter()
  const [name, setName] = useState("")
  const [kind, setKind] = useState<CategoryKind>("BOTH")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, kind }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao criar categoria")
      }

      setName("")
      setKind("BOTH")
      router.refresh()
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar categoria")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">{t("form.name")}</FieldLabel>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("form.namePlaceholder")}
            required
            disabled={isLoading}
          />
          <FieldDescription>{t("form.nameDescription")}</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="kind">{t("form.kind")}</FieldLabel>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={isLoading}
              >
                {t(`kinds.${kind}`)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              <DropdownMenuItem onClick={() => setKind("IN")}>
                {t("kinds.IN")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setKind("OUT")}>
                {t("kinds.OUT")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setKind("BOTH")}>
                {t("kinds.BOTH")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <FieldDescription>{t("form.kindDescription")}</FieldDescription>
        </Field>

        {error && <FieldError>{error}</FieldError>}
      </FieldGroup>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setName("")
            setKind("BOTH")
            setError("")
          }}
          disabled={isLoading}
        >
          {t("form.clear")}
        </Button>
        <Button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? t("form.saving") : t("form.save")}
        </Button>
      </div>
    </form>
  )
}
