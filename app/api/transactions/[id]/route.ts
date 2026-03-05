import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
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
        if (categoryId !== undefined) dataToUpdate.categoryId = parseInt(categoryId.toString())
        if (accountId !== undefined) dataToUpdate.accountId = accountId ? parseInt(accountId.toString()) : null
        if (paymentMethodId !== undefined) dataToUpdate.paymentMethodId = paymentMethodId ? parseInt(paymentMethodId.toString()) : null
        if (notes !== undefined) dataToUpdate.notes = notes

        const transaction = await prisma.transaction.update({
            where: { id: parseInt(id) },
            data: dataToUpdate,
            include: {
                category: true,
                account: true,
                paymentMethod: true,
            }
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
        const { id } = await params

        await prisma.transaction.delete({
            where: { id: parseInt(id) },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting transaction:", error)
        return NextResponse.json(
            { error: "Error deleting transaction" },
            { status: 500 }
        )
    }
}
