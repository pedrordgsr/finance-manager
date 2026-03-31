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
import type { AccountType } from "@/generated/prisma/client"

interface AccountFormProps {
    onSuccess?: () => void
}

export function AccountForm({ onSuccess }: AccountFormProps) {
    const t = useTranslations("accounts")
    const router = useRouter()
    const [name, setName] = useState("")
    const [type, setType] = useState<AccountType>("BANK")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string>("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const response = await fetch("/api/accounts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, type }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Erro ao criar conta")
            }

            setName("")
            setType("BANK")
            router.refresh()
            onSuccess?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao criar conta")
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
                    <FieldLabel htmlFor="type">{t("form.type")}</FieldLabel>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                disabled={isLoading}
                            >
                                {t(`types.${type}`)}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full">
                            <DropdownMenuItem onClick={() => setType("CASH")}>
                                {t("types.CASH")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setType("BANK")}>
                                {t("types.BANK")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setType("CREDIT_CARD")}>
                                {t("types.CREDIT_CARD")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setType("INVESTMENT")}>
                                {t("types.INVESTMENT")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <FieldDescription>{t("form.typeDescription")}</FieldDescription>
                </Field>

                {error && <FieldError>{error}</FieldError>}
            </FieldGroup>

            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        setName("")
                        setType("BANK")
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
