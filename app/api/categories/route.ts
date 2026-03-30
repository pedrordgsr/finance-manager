import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUserId } from "@/lib/auth-session"

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, kind } = body

    if (!name || !kind) {
      return NextResponse.json(
        { error: "Name and kind are required" },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        userId,
        name,
        kind,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Error creating category" },
      { status: 500 }
    )
  }
}
