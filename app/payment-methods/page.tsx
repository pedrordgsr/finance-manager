import { prisma } from "@/lib/prisma";
import { PaymentMethodsTable } from "@/components/payment-methods-table";
import { getTranslations } from 'next-intl/server';
import { requireUserId } from "@/lib/auth-session";

interface PaymentMethodsPageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
    }>;
}

export default async function PaymentMethodsPage({ searchParams }: PaymentMethodsPageProps) {
    const t = await getTranslations('paymentMethods');
    const userId = await requireUserId();
    const params = await searchParams;
    const currentPage = parseInt(params.page || "1");
    const searchQuery = params.search || "";
    const itemsPerPage = 10;

    const where: any = { userId };

    if (searchQuery) {
        where.name = {
            contains: searchQuery,
        };
    }

    const [paymentMethods, totalCount] = await Promise.all([
        prisma.paymentMethod.findMany({
            where,
            orderBy: {
                name: "asc",
            },
            skip: (currentPage - 1) * itemsPerPage,
            take: itemsPerPage,
        }),
        prisma.paymentMethod.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return (
        <div className="flex flex-col gap-4 p-4 pt-0">
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <PaymentMethodsTable
                paymentMethods={paymentMethods}
                currentPage={currentPage}
                totalPages={totalPages}
                searchQuery={searchQuery}
            />
        </div>
    );
}
