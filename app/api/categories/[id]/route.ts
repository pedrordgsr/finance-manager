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
    const categoryId = parseInt(id)
    const body = await request.json()
    const { name, kind } = body

    if (!name || !kind) {
      return NextResponse.json(
        { error: "Name and kind are required" },
        { status: 400 }
      )
    }

    const updated = await prisma.category.updateMany({
      where: { id: categoryId, userId },
      data: { name, kind },
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    })

    return NextResponse.json(category)
  } catch (error: any) {
    // P2002 is the Prisma code for unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 }
      )
    }

    console.error("Unexpected error updating category:", error);
    return NextResponse.json(
      { error: "Error updating category" },
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
    const categoryId = parseInt(id)

    const deleted = await prisma.category.deleteMany({
      where: { id: categoryId, userId },
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    // P2003 is the Prisma code for foreign key constraint violation
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Cannot delete category because it is being used by transactions" },
        { status: 409 }
      )
    }

    console.error("Unexpected error deleting category:", error);
    return NextResponse.json(
      { error: "Error deleting category" },
      { status: 500 }
    )
  }
}
