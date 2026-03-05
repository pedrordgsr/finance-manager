import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      )
    }

    const account = await prisma.account.create({
      data: {
        name,
        type,
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error("Error creating account:", error)
    
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "An account with this name already exists" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Error creating account" },
      { status: 500 }
    )
  }
}
