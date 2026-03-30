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
        const accountId = parseInt(id)
        const body = await request.json()
        const { name, type } = body

        if (!name || !type) {
            return NextResponse.json(
                { error: "Name and type are required" },
                { status: 400 }
            )
        }

        const updated = await prisma.account.updateMany({
            where: { id: accountId, userId },
            data: { name, type },
        })

        if (updated.count === 0) {
            return NextResponse.json(
                { error: "Account not found" },
                { status: 404 }
            )
        }

        const account = await prisma.account.findFirst({
            where: { id: accountId, userId },
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
        const userId = await getCurrentUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const accountId = parseInt(id)

        const deleted = await prisma.account.deleteMany({
            where: { id: accountId, userId },
        })

        if (deleted.count === 0) {
            return NextResponse.json(
                { error: "Account not found" },
                { status: 404 }
            )
        }

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
