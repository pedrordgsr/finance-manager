"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/components/settings-provider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { TransactionForm } from "@/components/transaction-form";
import type { Transaction, Category, Account, PaymentMethod } from "@prisma/client";

interface ExtendedTransaction extends Transaction {
    category: Category;
    account: Account | null;
    paymentMethod: PaymentMethod | null;
}

interface TransactionsTableProps {
    transactions: ExtendedTransaction[];
    categories: Category[];
    accounts: Account[];
    paymentMethods: PaymentMethod[];
    currentPage: number;
    totalPages: number;
    searchQuery: string;
}

export function TransactionsTable({
    transactions,
    categories,
    accounts,
    paymentMethods,
    currentPage,
    totalPages,
    searchQuery,
}: TransactionsTableProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [search, setSearch] = useState(searchQuery);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<ExtendedTransaction | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteError, setDeleteError] = useState<string>("");
    const [editError, setEditError] = useState<string>("");

    // Edit states
    const [editDescription, setEditDescription] = useState("");
    const [editAmount, setEditAmount] = useState("");
    const [editDirection, setEditDirection] = useState<"IN" | "OUT">("OUT");
    const [editIssueDate, setEditIssueDate] = useState("");
    const [editSettlementDate, setEditSettlementDate] = useState("");
    const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
    const [editAccountId, setEditAccountId] = useState<number | null>(null);
    const [editPaymentMethodId, setEditPaymentMethodId] = useState<number | null>(null);
    const [editNotes, setEditNotes] = useState("");

    const t = useTranslations('transactions');
    const locale = useLocale();
    const { settings } = useSettings();
    const searchParams = useSearchParams();

    const currentDirectionFilter = searchParams.get("direction") || "";
    const currentCategoryFilter = searchParams.get("categoryId") || "";

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
            style: 'currency',
            currency: settings.currency
        }).format(cents / 100);
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) params.set("search", value);
            else params.delete("search");
            params.set("page", "1");
            router.push(`/transactions?${params.toString()}`);
        });
    };

    const handleFilterChange = (key: string, value: string) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) params.set(key, value);
            else params.delete(key);
            params.set("page", "1");
            router.push(`/transactions?${params.toString()}`);
        });
    };

    const handlePageChange = (page: number) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", page.toString());
            router.push(`/transactions?${params.toString()}`);
        });
    };

    const handleDeleteClick = (transaction: ExtendedTransaction) => {
        setSelectedTransaction(transaction);
        setDeleteError("");
        setDeleteDialogOpen(true);
    };

    const handleEditClick = (transaction: ExtendedTransaction) => {
        setSelectedTransaction(transaction);
        setEditDescription(transaction.description);
        setEditAmount((transaction.amountCents / 100).toFixed(2));
        setEditDirection(transaction.direction);
        setEditIssueDate(new Date(transaction.issueDate).toISOString().split('T')[0]);
        setEditSettlementDate(transaction.settlementDate ? new Date(transaction.settlementDate).toISOString().split('T')[0] : "");
        setEditCategoryId(transaction.categoryId);
        setEditAccountId(transaction.accountId);
        setEditPaymentMethodId(transaction.paymentMethodId);
        setEditNotes(transaction.notes || "");
        setEditError("");
        setEditDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedTransaction) return;
        setIsDeleting(true);
        setDeleteError("");

        try {
            const response = await fetch(`/api/transactions/${selectedTransaction.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Error deleting transaction");
            }

            setDeleteDialogOpen(false);
            setSelectedTransaction(null);
            router.refresh();
        } catch (error) {
            setDeleteError(error instanceof Error ? error.message : "Error deleting transaction");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = async () => {
        if (!selectedTransaction) return;
        setIsEditing(true);
        setEditError("");

        try {
            const response = await fetch(`/api/transactions/${selectedTransaction.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: editDescription,
                    amountCents: Math.round(parseFloat(editAmount.replace(",", ".")) * 100),
                    direction: editDirection,
                    issueDate: new Date(editIssueDate).toISOString(),
                    settlementDate: editSettlementDate ? new Date(editSettlementDate).toISOString() : null,
                    categoryId: editCategoryId,
                    accountId: editAccountId,
                    paymentMethodId: editPaymentMethodId,
                    notes: editNotes || null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Error updating transaction");
            }

            setEditDialogOpen(false);
            setSelectedTransaction(null);
            router.refresh();
        } catch (error) {
            setEditError(error instanceof Error ? error.message : "Error updating transaction");
        } finally {
            setIsEditing(false);
        }
    };

    const getDirectionClass = (direction: string) => {
        return direction === "IN"
            ? "text-green-600 dark:text-green-400 font-medium"
            : "text-red-600 dark:text-red-400 font-medium";
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    placeholder={t('searchPlaceholder')}
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="max-w-[200px]"
                />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            {currentDirectionFilter ? t(`directions.${currentDirectionFilter}`) : t('filter.allDirections')}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleFilterChange("direction", "")}>
                            {t('filter.allDirections')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFilterChange("direction", "IN")}>
                            {t('directions.IN')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFilterChange("direction", "OUT")}>
                            {t('directions.OUT')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            {currentCategoryFilter && categories.find(c => c.id.toString() === currentCategoryFilter)?.name
                                || t('filter.allCategories')}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-60 overflow-y-auto">
                        <DropdownMenuItem onClick={() => handleFilterChange("categoryId", "")}>
                            {t('filter.allCategories')}
                        </DropdownMenuItem>
                        {categories.map((c) => (
                            <DropdownMenuItem key={c.id} onClick={() => handleFilterChange("categoryId", c.id.toString())}>
                                {c.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex-1" />

                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('newTransaction')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{t('form.title')}</DialogTitle>
                            <DialogDescription>{t('form.description')}</DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                            <TransactionForm
                                categories={categories}
                                accounts={accounts}
                                paymentMethods={paymentMethods}
                                onSuccess={() => router.refresh()}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('table.issueDate')}</TableHead>
                            <TableHead>{t('table.description')}</TableHead>
                            <TableHead>{t('table.category')}</TableHead>
                            <TableHead>{t('table.amount')}</TableHead>
                            <TableHead className="hidden md:table-cell">{t('table.account')}</TableHead>
                            <TableHead className="w-[100px]">{t('table.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    {t('noResults')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell suppressHydrationWarning>
                                        {new Date(transaction.issueDate).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US')}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{transaction.description}</span>
                                            {transaction.settlementDate && (
                                                <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                                                    {t('table.settlementDate')}: {new Date(transaction.settlementDate).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US')}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{transaction.category.name}</Badge>
                                    </TableCell>
                                    <TableCell className={getDirectionClass(transaction.direction)}>
                                        {transaction.direction === "IN" ? "+" : "-"} {formatCurrency(transaction.amountCents)}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                        {transaction.account?.name || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditClick(transaction)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteClick(transaction)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        {t('pagination.page')} {currentPage} {t('pagination.of')} {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1 || isPending}
                        >
                            {t('pagination.previous')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages || isPending}
                        >
                            {t('pagination.next')}
                        </Button>
                    </div>
                </div>
            )}

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('delete.title')}</DialogTitle>
                        <DialogDescription>
                            {t('delete.description', { description: selectedTransaction?.description || '' })}
                        </DialogDescription>
                    </DialogHeader>
                    {deleteError && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {deleteError}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                            {t('delete.cancel')}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? t('delete.deleting') : t('delete.confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('edit.title')}</DialogTitle>
                        <DialogDescription>{t('edit.description')}</DialogDescription>
                    </DialogHeader>

                    {/* Inline edit form manually because we want to use the dialog's submit button or not - Actually let's just use the exact same fields as creating but controlled here */}
                    <div className="space-y-4 py-4">
                        <Field>
                            <FieldLabel>{t("form.transactionDescription")} *</FieldLabel>
                            <Input
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                disabled={isEditing}
                            />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel>{t("form.amount")} *</FieldLabel>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                    disabled={isEditing}
                                />
                            </Field>

                            <Field>
                                <FieldLabel>{t("form.direction")} *</FieldLabel>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start" disabled={isEditing}>
                                            {t(`directions.${editDirection}`)}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-full">
                                        <DropdownMenuItem onClick={() => setEditDirection("IN")}>
                                            {t("directions.IN")}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setEditDirection("OUT")}>
                                            {t("directions.OUT")}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel>{t("form.issueDate")} *</FieldLabel>
                                <Input
                                    type="date"
                                    value={editIssueDate}
                                    onChange={(e) => setEditIssueDate(e.target.value)}
                                    disabled={isEditing}
                                />
                            </Field>

                            <Field>
                                <FieldLabel>{t("form.settlementDate")}</FieldLabel>
                                <Input
                                    type="date"
                                    value={editSettlementDate}
                                    onChange={(e) => setEditSettlementDate(e.target.value)}
                                    disabled={isEditing}
                                />
                            </Field>
                        </div>

                        <Field>
                            <FieldLabel>{t("form.category")} *</FieldLabel>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start" disabled={isEditing}>
                                        {editCategoryId && categories.find(c => c.id === editCategoryId)?.name
                                            || t("form.categoryPlaceholder")}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-full max-h-60 overflow-y-auto">
                                    {categories.map((category) => (
                                        <DropdownMenuItem key={category.id} onClick={() => setEditCategoryId(category.id)}>
                                            {category.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel>{t("form.account")}</FieldLabel>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start" disabled={isEditing}>
                                            {editAccountId && accounts.find(a => a.id === editAccountId)?.name
                                                || t("form.accountPlaceholder")}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-full max-h-60 overflow-y-auto">
                                        <DropdownMenuItem onClick={() => setEditAccountId(null)}>
                                            --
                                        </DropdownMenuItem>
                                        {accounts.map((account) => (
                                            <DropdownMenuItem key={account.id} onClick={() => setEditAccountId(account.id)}>
                                                {account.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </Field>

                            <Field>
                                <FieldLabel>{t("form.paymentMethod")}</FieldLabel>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start" disabled={isEditing}>
                                            {editPaymentMethodId && paymentMethods.find(a => a.id === editPaymentMethodId)?.name
                                                || t("form.paymentMethodPlaceholder")}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-full max-h-60 overflow-y-auto">
                                        <DropdownMenuItem onClick={() => setEditPaymentMethodId(null)}>
                                            --
                                        </DropdownMenuItem>
                                        {paymentMethods.map((pm) => (
                                            <DropdownMenuItem key={pm.id} onClick={() => setEditPaymentMethodId(pm.id)}>
                                                {pm.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </Field>
                        </div>

                        <Field>
                            <FieldLabel>{t("form.notes")}</FieldLabel>
                            <Input
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                disabled={isEditing}
                            />
                        </Field>
                    </div>

                    {editError && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {editError}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isEditing}>
                            {t('edit.cancel')}
                        </Button>
                        <Button onClick={handleEdit} disabled={isEditing || !editDescription.trim() || !editAmount || !editCategoryId}>
                            {isEditing ? t('edit.saving') : t('edit.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
