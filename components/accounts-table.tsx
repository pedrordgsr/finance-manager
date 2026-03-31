"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { AccountForm } from "@/components/account-form";
import type { Account, AccountType } from "@/generated/prisma/client";
import { useTranslations, useLocale } from "next-intl";

interface AccountsTableProps {
    accounts: Account[];
    currentPage: number;
    totalPages: number;
    searchQuery: string;
    typeFilter: string;
}

export function AccountsTable({
    accounts,
    currentPage,
    totalPages,
    searchQuery,
    typeFilter,
}: AccountsTableProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [search, setSearch] = useState(searchQuery);
    const [type, setType] = useState(typeFilter);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [editName, setEditName] = useState("");
    const [editType, setEditType] = useState<AccountType>("BANK");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteError, setDeleteError] = useState<string>("");
    const [editError, setEditError] = useState<string>("");
    const t = useTranslations('accounts');
    const locale = useLocale();

    const getTypeBadge = (type: string) => {
        switch (type) {
            case "CASH":
                return { variant: "outline" as const, className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" };
            case "BANK":
                return { variant: "secondary" as const, className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" };
            case "CREDIT_CARD":
                return { variant: "destructive" as const, className: "" };
            case "INVESTMENT":
                return { variant: "outline" as const, className: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800" };
            default:
                return { variant: "outline" as const, className: "" };
        }
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        startTransition(() => {
            const params = new URLSearchParams();
            if (value) {
                params.set("search", value);
            }
            if (type) {
                params.set("type", type);
            }
            params.set("page", "1");
            router.push(`/accounts?${params.toString()}`);
        });
    };

    const handleTypeChange = (value: string) => {
        setType(value);
        startTransition(() => {
            const params = new URLSearchParams();
            if (search) {
                params.set("search", search);
            }
            if (value) {
                params.set("type", value);
            }
            params.set("page", "1");
            router.push(`/accounts?${params.toString()}`);
        });
    };

    const handlePageChange = (page: number) => {
        startTransition(() => {
            const params = new URLSearchParams();
            if (searchQuery) {
                params.set("search", searchQuery);
            }
            if (typeFilter) {
                params.set("type", typeFilter);
            }
            params.set("page", page.toString());
            router.push(`/accounts?${params.toString()}`);
        });
    };

    const handleDeleteClick = (account: Account) => {
        setSelectedAccount(account);
        setDeleteError("");
        setDeleteDialogOpen(true);
    };

    const handleEditClick = (account: Account) => {
        setSelectedAccount(account);
        setEditName(account.name);
        setEditType(account.type);
        setEditError("");
        setEditDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedAccount) return;
        setIsDeleting(true);
        setDeleteError("");

        try {
            const response = await fetch(`/api/accounts/${selectedAccount.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                const errorKey = data.error || 'error';
                throw new Error(t(`delete.${errorKey}`));
            }

            setDeleteDialogOpen(false);
            setSelectedAccount(null);
            router.refresh();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('delete.error');
            setDeleteError(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = async () => {
        if (!selectedAccount) return;
        setIsEditing(true);
        setEditError("");

        try {
            const response = await fetch(`/api/accounts/${selectedAccount.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: editName, type: editType }),
            });

            if (!response.ok) {
                const data = await response.json();
                const errorKey = data.error || 'error';
                throw new Error(t(`edit.${errorKey}`));
            }

            setEditDialogOpen(false);
            setSelectedAccount(null);
            router.refresh();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('edit.error');
            setEditError(errorMessage);
        } finally {
            setIsEditing(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Input
                    placeholder={t('searchPlaceholder')}
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="min-w-[140px]">
                            {type ? t(`types.${type}`) : t('filter.allTypes')}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleTypeChange("")}>
                            {t('filter.allTypes')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTypeChange("CASH")}>
                            {t('types.CASH')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTypeChange("BANK")}>
                            {t('types.BANK')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTypeChange("CREDIT_CARD")}>
                            {t('types.CREDIT_CARD')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTypeChange("INVESTMENT")}>
                            {t('types.INVESTMENT')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex-1" />
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4" />
                            {t('newAccount')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('form.title')}</DialogTitle>
                            <DialogDescription>{t('form.description')}</DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                            <AccountForm />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('table.id')}</TableHead>
                            <TableHead>{t('table.name')}</TableHead>
                            <TableHead>{t('table.type')}</TableHead>
                            <TableHead>{t('table.createdAt')}</TableHead>
                            <TableHead className="w-[100px]">{t('table.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {accounts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    {t('noResults')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            accounts.map((account) => (
                                <TableRow key={account.id}>
                                    <TableCell className="font-medium">{account.id}</TableCell>
                                    <TableCell>{account.name}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={getTypeBadge(account.type).variant}
                                            className={getTypeBadge(account.type).className}
                                        >
                                            {t(`types.${account.type}`)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(account.createdAt).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditClick(account)}
                                                aria-label={t('actions.edit')}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteClick(account)}
                                                aria-label={t('actions.delete')}
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
                            {t('delete.description', { name: selectedAccount?.name || '' })}
                        </DialogDescription>
                    </DialogHeader>
                    {deleteError && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {deleteError}
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            {t('delete.cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? t('delete.deleting') : t('delete.confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('edit.title')}</DialogTitle>
                        <DialogDescription>{t('edit.description')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Field>
                            <FieldLabel htmlFor="edit-name">{t('form.name')}</FieldLabel>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder={t('form.namePlaceholder')}
                            />
                            <FieldDescription>{t('form.nameDescription')}</FieldDescription>
                        </Field>
                        <Field>
                            <FieldLabel>{t('form.type')}</FieldLabel>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start">
                                        {t(`types.${editType}`)}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-full">
                                    <DropdownMenuItem onClick={() => setEditType("CASH")}>
                                        {t('types.CASH')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setEditType("BANK")}>
                                        {t('types.BANK')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setEditType("CREDIT_CARD")}>
                                        {t('types.CREDIT_CARD')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setEditType("INVESTMENT")}>
                                        {t('types.INVESTMENT')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <FieldDescription>{t('form.typeDescription')}</FieldDescription>
                        </Field>
                    </div>
                    {editError && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {editError}
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditDialogOpen(false)}
                            disabled={isEditing}
                        >
                            {t('edit.cancel')}
                        </Button>
                        <Button
                            onClick={handleEdit}
                            disabled={isEditing || !editName.trim()}
                        >
                            {isEditing ? t('edit.saving') : t('edit.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
