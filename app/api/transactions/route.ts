import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Direction } from "@prisma/client"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const direction = searchParams.get("direction")
    const categoryId = searchParams.get("categoryId")
    const accountId = searchParams.get("accountId")
    const paymentMethodId = searchParams.get("paymentMethodId")

    const where: any = {}

    if (search) {
        where.description = { contains: search }
    }

    if (direction) {
        where.direction = direction as Direction
    }

    if (categoryId) {
        where.categoryId = parseInt(categoryId)
    }

    if (accountId) {
        where.accountId = parseInt(accountId)
    }

    if (paymentMethodId) {
        where.paymentMethodId = parseInt(paymentMethodId)
    }

    try {
        const [transactions, totalCount] = await Promise.all([
            prisma.transaction.findMany({
                where,
                orderBy: [
                    { issueDate: "desc" },
                    { createdAt: "desc" }
                ],
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    category: true,
                    account: true,
                    paymentMethod: true,
                }
            }),
            prisma.transaction.count({ where }),
        ])

        return NextResponse.json({ transactions, totalCount })
    } catch (error) {
        console.error("Error fetching transactions:", error)
        return NextResponse.json(
            { error: "Error fetching transactions" },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
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

        if (!description || amountCents === undefined || !direction || !issueDate || !categoryId) {
            return NextResponse.json(
                { error: "Required fields are missing" },
                { status: 400 }
            )
        }

        const transaction = await prisma.transaction.create({
            data: {
                description,
                amountCents: parseInt(amountCents.toString()),
                direction,
                issueDate: new Date(issueDate),
                settlementDate: settlementDate ? new Date(settlementDate) : null,
                categoryId: parseInt(categoryId.toString()),
                accountId: accountId ? parseInt(accountId.toString()) : null,
                paymentMethodId: paymentMethodId ? parseInt(paymentMethodId.toString()) : null,
                notes,
            },
            include: {
                category: true,
                account: true,
                paymentMethod: true,
            }
        })

        return NextResponse.json(transaction, { status: 201 })
    } catch (error) {
        console.error("Error creating transaction:", error)
        return NextResponse.json(
            { error: "Error creating transaction" },
            { status: 500 }
        )
    }
}
