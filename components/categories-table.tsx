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
import { CategoryForm } from "@/components/category-form";
import type { Category } from "@/generated/prisma/client";
import { useTranslations, useLocale } from "next-intl";

interface CategoriesTableProps {
  categories: Category[];
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  kindFilter: string;
}

export function CategoriesTable({
  categories,
  currentPage,
  totalPages,
  searchQuery,
  kindFilter,
}: CategoriesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchQuery);
  const [kind, setKind] = useState(kindFilter);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editKind, setEditKind] = useState<"IN" | "OUT" | "BOTH">("BOTH");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string>("");
  const [editError, setEditError] = useState<string>("");
  const t = useTranslations('categories');
  const locale = useLocale();

  const getKindBadge = (kind: string) => {
    switch (kind) {
      case "IN":
        return { variant: "outline" as const, className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" };
      case "OUT":
        return { variant: "destructive" as const, className: "" };
      case "BOTH":
        return { variant: "secondary" as const, className: "" };
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
      if (kind) {
        params.set("kind", kind);
      }
      params.set("page", "1");
      router.push(`/categories?${params.toString()}`);
    });
  };

  const handleKindChange = (value: string) => {
    setKind(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (search) {
        params.set("search", search);
      }
      if (value) {
        params.set("kind", value);
      }
      params.set("page", "1");
      router.push(`/categories?${params.toString()}`);
    });
  };

  const handlePageChange = (page: number) => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.set("search", searchQuery);
      }
      if (kindFilter) {
        params.set("kind", kindFilter);
      }
      params.set("page", page.toString());
      router.push(`/categories?${params.toString()}`);
    });
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setDeleteError("");
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (category: Category) => {
    setSelectedCategory(category);
    setEditName(category.name);
    setEditKind(category.kind as "IN" | "OUT" | "BOTH");
    setEditError("");
    setEditDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    setIsDeleting(true);
    setDeleteError("");
    
    try {
      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        const errorKey = data.error || 'error';
        throw new Error(t(`delete.${errorKey}`));
      }

      setDeleteDialogOpen(false);
      setSelectedCategory(null);
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('delete.error');
      setDeleteError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCategory) return;
    setIsEditing(true);
    setEditError("");
    
    try {
      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editName, kind: editKind }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorKey = data.error || 'error';
        throw new Error(t(`edit.${errorKey}`));
      }

      setEditDialogOpen(false);
      setSelectedCategory(null);
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
              {kind ? t(`kinds.${kind}`) : t('filter.allTypes')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleKindChange("")}>
              {t('filter.allTypes')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleKindChange("IN")}>
              {t('kinds.IN')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleKindChange("OUT")}>
              {t('kinds.OUT')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleKindChange("BOTH")}>
              {t('kinds.BOTH')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex-1" />
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              {t('newCategory')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('form.title')}</DialogTitle>
              <DialogDescription>{t('form.description')}</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <CategoryForm />
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
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t('noResults')}
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.id}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={getKindBadge(category.kind).variant}
                      className={getKindBadge(category.kind).className}
                    >
                      {t(`kinds.${category.kind}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(category.createdAt).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(category)}
                        aria-label={t('actions.edit')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(category)}
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
              {t('delete.description', { name: selectedCategory?.name || '' })}
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
              <FieldLabel>{t('form.kind')}</FieldLabel>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {t(`kinds.${editKind}`)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem onClick={() => setEditKind("IN")}>
                    {t('kinds.IN')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditKind("OUT")}>
                    {t('kinds.OUT')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditKind("BOTH")}>
                    {t('kinds.BOTH')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <FieldDescription>{t('form.kindDescription')}</FieldDescription>
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
