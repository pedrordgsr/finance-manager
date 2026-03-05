import { prisma } from "@/lib/prisma";
import { AccountsTable } from "@/components/accounts-table";
import { getTranslations } from 'next-intl/server';

interface AccountsPageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        type?: string;
    }>;
}

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
    const t = await getTranslations('accounts');
    const params = await searchParams;
    const currentPage = parseInt(params.page || "1");
    const searchQuery = params.search || "";
    const typeFilter = params.type || "";
    const itemsPerPage = 10;

    const where: any = {};

    if (searchQuery) {
        where.name = {
            contains: searchQuery,
        };
    }

    if (typeFilter) {
        where.type = typeFilter;
    }

    const [accounts, totalCount] = await Promise.all([
        prisma.account.findMany({
            where,
            orderBy: {
                name: "asc",
            },
            skip: (currentPage - 1) * itemsPerPage,
            take: itemsPerPage,
        }),
        prisma.account.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return (
        <div className="flex flex-col gap-4 p-4 pt-0">
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <AccountsTable
                accounts={accounts}
                currentPage={currentPage}
                totalPages={totalPages}
                searchQuery={searchQuery}
                typeFilter={typeFilter}
            />
        </div>
    );
}
