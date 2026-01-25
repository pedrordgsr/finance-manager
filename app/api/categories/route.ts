import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
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
