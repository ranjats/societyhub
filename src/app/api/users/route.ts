import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { userCreateSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const authResult = await requirePermission("users:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const users = await prisma.user.findMany({
      where: { societyId: context.societyId, deletedAt: null },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true,
        role: true, isActive: true, lastLoginAt: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requirePermission("users:create");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const body = await request.json();
    const validated = userCreateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email: validated.data.email } });
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(validated.data.password, 12);
    const { password: _password, isActive: _isActive, ...userData } = validated.data;

    const user = await prisma.user.create({
      data: { ...userData, passwordHash, societyId: context.societyId },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
