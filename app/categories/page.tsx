import { prisma } from "@/lib/prisma";
import { CategoriesTable } from "@/components/categories-table";
import {getTranslations} from 'next-intl/server';

interface CategoriesPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const t = await getTranslations('categories');
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1");
  const searchQuery = params.search || "";
  const itemsPerPage = 10;

  const where = searchQuery
    ? {
        name: {
          contains: searchQuery,
        },
      }
    : {};

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>
      <CategoriesTable
        categories={categories}
        currentPage={currentPage}
        totalPages={totalPages}
        searchQuery={searchQuery}
      />
    </div>
  );
}
