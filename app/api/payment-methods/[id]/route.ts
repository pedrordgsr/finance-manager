import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name } = body

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            )
        }

        const paymentMethod = await prisma.paymentMethod.update({
            where: { id: parseInt(id) },
            data: { name },
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
        const { id } = await params

        await prisma.paymentMethod.delete({
            where: { id: parseInt(id) },
        })

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
