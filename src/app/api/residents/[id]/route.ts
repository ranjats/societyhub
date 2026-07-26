import { NextResponse } from "next/server";
import { requireAuth, requirePermission, verifySocietyAccess, verifyResidentAccess } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { residentSchema } from "@/lib/validations";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("residents:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { id } = await params;

    const resident = await prisma.resident.findFirst({
      where: { id, societyId: context.societyId, deletedAt: null },
      include: { flat: true, vehicles: true },
    });

    if (!resident) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    // Residents can only view their own profile
    if (context.role === "RESIDENT" && !verifyResidentAccess(context, resident.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(resident);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch resident" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("residents:edit");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { id } = await params;

    const existing = await prisma.resident.findFirst({
      where: { id, societyId: context.societyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = residentSchema.partial().safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const resident = await prisma.resident.update({
      where: { id },
      data: validated.data,
      include: { flat: true, vehicles: true },
    });

    return NextResponse.json(resident);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update resident" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("residents:delete");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { id } = await params;

    const existing = await prisma.resident.findFirst({
      where: { id, societyId: context.societyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    // Soft delete
    await prisma.resident.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ message: "Resident deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete resident" }, { status: 500 });
  }
}
