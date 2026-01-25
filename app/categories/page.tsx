import { prisma } from "@/lib/prisma";
import { CategoriesTable } from "@/components/categories-table";
import { CategoryForm } from "@/components/category-form";
import {getTranslations} from 'next-intl/server';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CategoriesPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    kind?: string;
  }>;
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const t = await getTranslations('categories');
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1");
  const searchQuery = params.search || "";
  const kindFilter = params.kind || "";
  const itemsPerPage = 10;

  const where: any = {};
  
  if (searchQuery) {
    where.name = {
      contains: searchQuery,
    };
  }
  
  if (kindFilter) {
    where.kind = kindFilter;
  }

  const [categories, totalCount] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: {
        name: "asc",
      },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage,
    }),
    prisma.category.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <CategoriesTable
        categories={categories}
        currentPage={currentPage}
        totalPages={totalPages}
        searchQuery={searchQuery}
        kindFilter={kindFilter}
      />
    </div>
  );
}
