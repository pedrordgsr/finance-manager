"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { PaymentMethodForm } from "@/components/payment-method-form";
import type { PaymentMethod } from "@prisma/client";
import { useTranslations, useLocale } from "next-intl";

interface PaymentMethodsTableProps {
    paymentMethods: PaymentMethod[];
    currentPage: number;
    totalPages: number;
    searchQuery: string;
}

export function PaymentMethodsTable({
    paymentMethods,
    currentPage,
    totalPages,
    searchQuery,
}: PaymentMethodsTableProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [search, setSearch] = useState(searchQuery);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
    const [editName, setEditName] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteError, setDeleteError] = useState<string>("");
    const [editError, setEditError] = useState<string>("");
    const t = useTranslations('paymentMethods');
    const locale = useLocale();

    const handleSearch = (value: string) => {
        setSearch(value);
        startTransition(() => {
            const params = new URLSearchParams();
            if (value) {
                params.set("search", value);
            }
            params.set("page", "1");
            router.push(`/payment-methods?${params.toString()}`);
        });
    };

    const handlePageChange = (page: number) => {
        startTransition(() => {
            const params = new URLSearchParams();
            if (searchQuery) {
                params.set("search", searchQuery);
            }
            params.set("page", page.toString());
            router.push(`/payment-methods?${params.toString()}`);
        });
    };

    const handleDeleteClick = (paymentMethod: PaymentMethod) => {
        setSelectedPaymentMethod(paymentMethod);
        setDeleteError("");
        setDeleteDialogOpen(true);
    };

    const handleEditClick = (paymentMethod: PaymentMethod) => {
        setSelectedPaymentMethod(paymentMethod);
        setEditName(paymentMethod.name);
        setEditError("");
        setEditDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedPaymentMethod) return;
        setIsDeleting(true);
        setDeleteError("");

        try {
            const response = await fetch(`/api/payment-methods/${selectedPaymentMethod.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                const errorKey = data.error || 'error';
                throw new Error(t(`delete.${errorKey}`));
            }

            setDeleteDialogOpen(false);
            setSelectedPaymentMethod(null);
            router.refresh();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('delete.error');
            setDeleteError(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = async () => {
        if (!selectedPaymentMethod) return;
        setIsEditing(true);
        setEditError("");

        try {
            const response = await fetch(`/api/payment-methods/${selectedPaymentMethod.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: editName }),
            });

            if (!response.ok) {
                const data = await response.json();
                const errorKey = data.error || 'error';
                throw new Error(t(`edit.${errorKey}`));
            }

            setEditDialogOpen(false);
            setSelectedPaymentMethod(null);
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
                <div className="flex-1" />
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4" />
                            {t('newMethod')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('form.title')}</DialogTitle>
                            <DialogDescription>{t('form.description')}</DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                            <PaymentMethodForm />
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
                            <TableHead>{t('table.createdAt')}</TableHead>
                            <TableHead className="w-[100px]">{t('table.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paymentMethods.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    {t('noResults')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            paymentMethods.map((method) => (
                                <TableRow key={method.id}>
                                    <TableCell className="font-medium">{method.id}</TableCell>
                                    <TableCell>{method.name}</TableCell>
                                    <TableCell>
                                        {new Date(method.createdAt).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditClick(method)}
                                                aria-label={t('actions.edit')}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteClick(method)}
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
                            {t('delete.description', { name: selectedPaymentMethod?.name || '' })}
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
