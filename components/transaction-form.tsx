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
import type { Category, Account, PaymentMethod } from "@/generated/prisma/client"

interface TransactionFormProps {
    categories: Category[]
    accounts: Account[]
    paymentMethods: PaymentMethod[]
    onSuccess?: () => void
}

export function TransactionForm({ categories, accounts, paymentMethods, onSuccess }: TransactionFormProps) {
    const t = useTranslations("transactions")
    const router = useRouter()

    const [description, setDescription] = useState("")
    const [amount, setAmount] = useState("")
    const [direction, setDirection] = useState<"IN" | "OUT">("OUT")
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0])
    const [settlementDate, setSettlementDate] = useState("")
    const [categoryId, setCategoryId] = useState<number | null>(null)
    const [accountId, setAccountId] = useState<number | null>(null)
    const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null)
    const [notes, setNotes] = useState("")

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string>("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!description || !amount || !direction || !issueDate || !categoryId) {
            setError(t("form.errorMissingFields") || "Please fill all required fields.")
            return
        }

        setIsLoading(true)

        try {
            const amountCents = Math.round(parseFloat(amount.replace(",", ".")) * 100)

            const response = await fetch("/api/transactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    description,
                    amountCents,
                    direction,
                    issueDate: new Date(issueDate).toISOString(),
                    settlementDate: settlementDate ? new Date(settlementDate).toISOString() : null,
                    categoryId,
                    accountId,
                    paymentMethodId,
                    notes: notes || null,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Error creating transaction")
            }

            setDescription("")
            setAmount("")
            setDirection("OUT")
            setIssueDate(new Date().toISOString().split("T")[0])
            setSettlementDate("")
            setCategoryId(null)
            setAccountId(null)
            setPaymentMethodId(null)
            setNotes("")

            router.refresh()
            onSuccess?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error creating transaction")
        } finally {
            setIsLoading(false)
        }
    }

    const selectedCategory = categories.find((c) => c.id === categoryId)
    const selectedAccount = accounts.find((a) => a.id === accountId)
    const selectedPaymentMethod = paymentMethods.find((p) => p.id === paymentMethodId)

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="description">{t("form.transactionDescription")} *</FieldLabel>
                    <Input
                        id="description"
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t("form.transactionDescriptionPlaceholder")}
                        required
                        disabled={isLoading}
                    />
                    <FieldDescription>{t("form.transactionDescriptionHint")}</FieldDescription>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="amount">{t("form.amount")} *</FieldLabel>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={t("form.amountPlaceholder")}
                            required
                            disabled={isLoading}
                        />
                        <FieldDescription>{t("form.amountHint")}</FieldDescription>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="direction">{t("form.direction")} *</FieldLabel>
                        <div className="flex gap-1 p-1 bg-muted rounded-md border h-10">
                            <Button
                                type="button"
                                variant={direction === "OUT" ? "secondary" : "ghost"}
                                size="sm"
                                className={`flex-1 ${direction === "OUT" ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-background/50"}`}
                                onClick={() => setDirection("OUT")}
                                disabled={isLoading}
                            >
                                {t("directions.OUT")}
                            </Button>
                            <Button
                                type="button"
                                variant={direction === "IN" ? "secondary" : "ghost"}
                                size="sm"
                                className={`flex-1 ${direction === "IN" ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-background/50"}`}
                                onClick={() => setDirection("IN")}
                                disabled={isLoading}
                            >
                                {t("directions.IN")}
                            </Button>
                        </div>
                        <FieldDescription>{t("form.directionHint")}</FieldDescription>
                    </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="issueDate">{t("form.issueDate")} *</FieldLabel>
                        <Input
                            id="issueDate"
                            type="date"
                            value={issueDate}
                            onChange={(e) => setIssueDate(e.target.value)}
                            required
                            disabled={isLoading}
                            className="w-full"
                        />
                        <FieldDescription>{t("form.issueDateHint")}</FieldDescription>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="settlementDate">{t("form.settlementDate")}</FieldLabel>
                        <Input
                            id="settlementDate"
                            type="date"
                            value={settlementDate}
                            onChange={(e) => setSettlementDate(e.target.value)}
                            disabled={isLoading}
                            className="w-full"
                        />
                        <FieldDescription>{t("form.settlementDateHint")}</FieldDescription>
                    </Field>
                </div>

                <Field>
                    <FieldLabel htmlFor="category">{t("form.category")} *</FieldLabel>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-start" disabled={isLoading}>
                                {selectedCategory ? selectedCategory.name : t("form.categoryPlaceholder")}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full max-h-60 overflow-y-auto">
                            {categories.map((category) => (
                                <DropdownMenuItem key={category.id} onClick={() => setCategoryId(category.id)}>
                                    {category.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <FieldDescription>{t("form.categoryHint")}</FieldDescription>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="account">{t("form.account")}</FieldLabel>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal" disabled={isLoading}>
                                    {selectedAccount ? selectedAccount.name : t("form.accountPlaceholder")}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                                <DropdownMenuItem onClick={() => setAccountId(null)}>
                                    --
                                </DropdownMenuItem>
                                {accounts.map((account) => (
                                    <DropdownMenuItem key={account.id} onClick={() => setAccountId(account.id)}>
                                        {account.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <FieldDescription>{t("form.accountHint")}</FieldDescription>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="paymentMethod">{t("form.paymentMethod")}</FieldLabel>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal" disabled={isLoading}>
                                    {selectedPaymentMethod ? selectedPaymentMethod.name : t("form.paymentMethodPlaceholder")}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                                <DropdownMenuItem onClick={() => setPaymentMethodId(null)}>
                                    --
                                </DropdownMenuItem>
                                {paymentMethods.map((pm) => (
                                    <DropdownMenuItem key={pm.id} onClick={() => setPaymentMethodId(pm.id)}>
                                        {pm.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <FieldDescription>{t("form.paymentMethodHint")}</FieldDescription>
                    </Field>
                </div>

                <Field>
                    <FieldLabel htmlFor="notes">{t("form.notes")}</FieldLabel>
                    <Input
                        id="notes"
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t("form.notesPlaceholder")}
                        disabled={isLoading}
                    />
                    <FieldDescription>{t("form.notesHint")}</FieldDescription>
                </Field>

                {error && <FieldError>{error}</FieldError>}
            </FieldGroup>

            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        setDescription("")
                        setAmount("")
                        setDirection("OUT")
                        setIssueDate(new Date().toISOString().split("T")[0])
                        setSettlementDate("")
                        setCategoryId(null)
                        setAccountId(null)
                        setPaymentMethodId(null)
                        setNotes("")
                        setError("")
                    }}
                    disabled={isLoading}
                >
                    {t("form.clear")}
                </Button>
                <Button type="submit" disabled={isLoading || !description.trim() || !amount || !categoryId}>
                    {isLoading ? t("form.saving") : t("form.save")}
                </Button>
            </div>
        </form>
    )
}
