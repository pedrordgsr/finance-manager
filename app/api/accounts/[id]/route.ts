import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, type } = body

        if (!name || !type) {
            return NextResponse.json(
                { error: "Name and type are required" },
                { status: 400 }
            )
        }

        const account = await prisma.account.update({
            where: { id: parseInt(id) },
            data: { name, type },
        })

        return NextResponse.json(account)
    } catch (error: any) {
        // P2002 is the Prisma code for unique constraint violation
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "An account with this name already exists" },
                { status: 409 }
            )
        }

        console.error("Unexpected error updating account:", error);
        return NextResponse.json(
            { error: "Error updating account" },
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

        await prisma.account.delete({
            where: { id: parseInt(id) },
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        // P2003 is the Prisma code for foreign key constraint violation
        if (error.code === 'P2003') {
            return NextResponse.json(
                { error: "Cannot delete account because it is being used by transactions" },
                { status: 409 }
            )
        }

        console.error("Unexpected error deleting account:", error);
        return NextResponse.json(
            { error: "Error deleting account" },
            { status: 500 }
        )
    }
}
