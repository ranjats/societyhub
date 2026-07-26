import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { flatSchema } from "@/lib/validations";

export async function GET() {
  try {
    const authResult = await requirePermission("flats:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const flats = await prisma.flat.findMany({
      where: {
        societyId: context.societyId,
        deletedAt: null,
      },
      include: {
        residents: {
          where: { deletedAt: null, isActive: true },
          select: { id: true, firstName: true, lastName: true, ownershipType: true },
        },
        collections: {
          where: { status: "PENDING", deletedAt: null },
          take: 1,
        },
      },
      orderBy: [{ floor: "asc" }, { flatNumber: "asc" }],
    });

    return NextResponse.json(flats);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch flats" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requirePermission("flats:create");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const body = await request.json();

    const validated = flatSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const flat = await prisma.flat.create({
      data: {
        ...validated.data,
        societyId: context.societyId,
      },
    });

    return NextResponse.json(flat, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create flat" }, { status: 500 });
  }
}
