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

interface PaymentMethodFormProps {
    onSuccess?: () => void
}

export function PaymentMethodForm({ onSuccess }: PaymentMethodFormProps) {
    const t = useTranslations("paymentMethods")
    const router = useRouter()
    const [name, setName] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string>("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const response = await fetch("/api/payment-methods", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Erro ao criar método de pagamento")
            }

            setName("")
            router.refresh()
            onSuccess?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao criar método de pagamento")
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

                {error && <FieldError>{error}</FieldError>}
            </FieldGroup>

            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        setName("")
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
