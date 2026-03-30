import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    const username = typeof body?.username === "string" ? body.username.toLowerCase().trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!name || !email || !username || !password) {
      return NextResponse.json(
        { error: "Name, username, email and password are required" },
        { status: 400 },
      );
    }

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3-20 chars and use only letters, numbers or underscore" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must have at least 6 characters" },
        { status: 400 },
      );
    }

    const exists = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
      select: { id: true },
    });

    if (exists) {
      return NextResponse.json(
        { error: "Email or username already registered" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json({ error: "Error registering user" }, { status: 500 });
  }
}
