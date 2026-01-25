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
        { error: "Nome e tipo são obrigatórios" },
        { status: 400 }
      )
    }

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name, kind },
    })

    return NextResponse.json(category)
  } catch (error: any) {
    // P2002 é o código do Prisma para violação de unique constraint
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "errorDuplicate" },
        { status: 409 }
      )
    }

    console.error("Erro inesperado ao atualizar categoria:", error);
    return NextResponse.json(
      { error: "error" },
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
    // P2003 é o código do Prisma para violação de foreign key constraint
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "errorForeignKey" },
        { status: 409 }
      )
    }

    console.error("Erro inesperado ao deletar categoria:", error);
    return NextResponse.json(
      { error: "error" },
      { status: 500 }
    )
  }
}
