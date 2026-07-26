import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { userUpdateSchema } from "@/lib/validations";

interface Params { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("users:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("users:edit");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const body = await request.json();
    const validated = userUpdateSchema.safeParse(body);
    if (!validated.success) return NextResponse.json({ error: "Validation failed", details: validated.error.flatten().fieldErrors }, { status: 400 });

    const user = await prisma.user.update({
      where: { id }, data: validated.data,
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, createdAt: true },
    });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("users:delete");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    if (id === context.userId) return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

    await prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
