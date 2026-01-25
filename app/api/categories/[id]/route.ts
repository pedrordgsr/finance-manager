import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, kind } = body

    if (!name || !kind) {
      return NextResponse.json(
        { error: "Name and kind are required" },
        { status: 400 }
      )
    }

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name, kind },
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
    const { id } = await params

    await prisma.category.delete({
      where: { id: parseInt(id) },
    })

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
