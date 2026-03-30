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
        const paymentMethodId = parseInt(id)
        const body = await request.json()
        const { name } = body

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            )
        }

        const updated = await prisma.paymentMethod.updateMany({
            where: { id: paymentMethodId, userId },
            data: { name },
        })

        if (updated.count === 0) {
            return NextResponse.json(
                { error: "Payment method not found" },
                { status: 404 }
            )
        }

        const paymentMethod = await prisma.paymentMethod.findFirst({
            where: { id: paymentMethodId, userId },
        })

        return NextResponse.json(paymentMethod)
    } catch (error: any) {
        // P2002 is the Prisma code for unique constraint violation
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A payment method with this name already exists" },
                { status: 409 }
            )
        }

        console.error("Unexpected error updating payment method:", error);
        return NextResponse.json(
            { error: "Error updating payment method" },
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
        const paymentMethodId = parseInt(id)

        const deleted = await prisma.paymentMethod.deleteMany({
            where: { id: paymentMethodId, userId },
        })

        if (deleted.count === 0) {
            return NextResponse.json(
                { error: "Payment method not found" },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        // P2003 is the Prisma code for foreign key constraint violation
        if (error.code === 'P2003') {
            return NextResponse.json(
                { error: "Cannot delete payment method because it is being used by transactions" },
                { status: 409 }
            )
        }

        console.error("Unexpected error deleting payment method:", error);
        return NextResponse.json(
            { error: "Error deleting payment method" },
            { status: 500 }
        )
    }
}
