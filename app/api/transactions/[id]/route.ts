import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserId } from "@/lib/auth-session"

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getCurrentUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const transactionId = parseInt(id)
        const body = await request.json()
        const {
            description,
            amountCents,
            direction,
            issueDate,
            settlementDate,
            categoryId,
            accountId,
            paymentMethodId,
            notes
        } = body

        const dataToUpdate: any = {}

        if (description !== undefined) dataToUpdate.description = description
        if (amountCents !== undefined) dataToUpdate.amountCents = parseInt(amountCents.toString())
        if (direction !== undefined) dataToUpdate.direction = direction
        if (issueDate !== undefined) dataToUpdate.issueDate = new Date(issueDate)
        if (settlementDate !== undefined) dataToUpdate.settlementDate = settlementDate ? new Date(settlementDate) : null
        if (categoryId !== undefined) {
            const normalizedCategoryId = parseInt(categoryId.toString())
            const category = await prisma.category.findFirst({
                where: { id: normalizedCategoryId, userId },
                select: { id: true },
            })

            if (!category) {
                return NextResponse.json({ error: "Invalid category" }, { status: 400 })
            }

            dataToUpdate.categoryId = normalizedCategoryId
        }

        if (accountId !== undefined) {
            const normalizedAccountId = accountId ? parseInt(accountId.toString()) : null

            if (normalizedAccountId) {
                const account = await prisma.account.findFirst({
                    where: { id: normalizedAccountId, userId },
                    select: { id: true },
                })

                if (!account) {
                    return NextResponse.json({ error: "Invalid account" }, { status: 400 })
                }
            }

            dataToUpdate.accountId = normalizedAccountId
        }

        if (paymentMethodId !== undefined) {
            const normalizedPaymentMethodId = paymentMethodId ? parseInt(paymentMethodId.toString()) : null

            if (normalizedPaymentMethodId) {
                const paymentMethod = await prisma.paymentMethod.findFirst({
                    where: { id: normalizedPaymentMethodId, userId },
                    select: { id: true },
                })

                if (!paymentMethod) {
                    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
                }
            }

            dataToUpdate.paymentMethodId = normalizedPaymentMethodId
        }
        if (notes !== undefined) dataToUpdate.notes = notes

        const updated = await prisma.transaction.updateMany({
            where: { id: transactionId, userId },
            data: dataToUpdate,
        })

        if (updated.count === 0) {
            return NextResponse.json(
                { error: "Transaction not found" },
                { status: 404 }
            )
        }

        const transaction = await prisma.transaction.findFirst({
            where: { id: transactionId, userId },
            include: {
                category: true,
                account: true,
                paymentMethod: true,
            },
        })

        return NextResponse.json(transaction)
    } catch (error) {
        console.error("Error updating transaction:", error)
        return NextResponse.json(
            { error: "Error updating transaction" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getCurrentUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const transactionId = parseInt(id)

        const deleted = await prisma.transaction.deleteMany({
            where: { id: transactionId, userId },
        })

        if (deleted.count === 0) {
            return NextResponse.json(
                { error: "Transaction not found" },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting transaction:", error)
        return NextResponse.json(
            { error: "Error deleting transaction" },
            { status: 500 }
        )
    }
}
