import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { flatSchema } from "@/lib/validations";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("flats:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { id } = await params;

    const flat = await prisma.flat.findFirst({
      where: { id, societyId: context.societyId, deletedAt: null },
      include: {
        residents: {
          where: { deletedAt: null, isActive: true },
          include: { vehicles: true },
        },
        collections: {
          where: { deletedAt: null },
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 12,
        },
      },
    });

    if (!flat) {
      return NextResponse.json({ error: "Flat not found" }, { status: 404 });
    }

    return NextResponse.json(flat);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch flat" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("flats:edit");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { id } = await params;

    const existing = await prisma.flat.findFirst({
      where: { id, societyId: context.societyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Flat not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = flatSchema.partial().safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const flat = await prisma.flat.update({
      where: { id },
      data: validated.data,
      include: { residents: true },
    });

    return NextResponse.json(flat);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update flat" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("flats:delete");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { id } = await params;

    const existing = await prisma.flat.findFirst({
      where: { id, societyId: context.societyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Flat not found" }, { status: 404 });
    }

    await prisma.flat.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Flat deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete flat" }, { status: 500 });
  }
}
