"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import type { Category } from "@/generated/prisma/models/Category";

interface CategoriesTableProps {
  categories: Category[];
  currentPage: number;
  totalPages: number;
  searchQuery: string;
}

const categoryKindLabels: Record<string, string> = {
  IN: "Entrada",
  OUT: "Saída",
  BOTH: "Ambos",
};

export function CategoriesTable({
  categories,
  currentPage,
  totalPages,
  searchQuery,
}: CategoriesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchQuery);

  const handleSearch = (value: string) => {
    setSearch(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value) {
        params.set("search", value);
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
      params.set("page", page.toString());
      router.push(`/categories?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar categorias..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Nenhuma categoria encontrada.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.id}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{categoryKindLabels[category.kind]}</TableCell>
                  <TableCell>
                    {new Date(category.createdAt).toLocaleDateString("pt-BR")}
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
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isPending}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
