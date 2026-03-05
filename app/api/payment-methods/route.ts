import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name } = body

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            )
        }

        const paymentMethod = await prisma.paymentMethod.create({
            data: {
                name,
            },
        })

        return NextResponse.json(paymentMethod, { status: 201 })
    } catch (error) {
        console.error("Error creating payment method:", error)

        if (error instanceof Error && error.message.includes("Unique constraint")) {
            return NextResponse.json(
                { error: "A payment method with this name already exists" },
                { status: 409 }
            )
        }

        return NextResponse.json(
            { error: "Error creating payment method" },
            { status: 500 }
        )
    }
}
