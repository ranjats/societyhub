import { NextResponse } from "next/server";
import { requireAuth, requirePermission, verifySocietyAccess } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { residentSchema } from "@/lib/validations";

export async function GET() {
  try {
    const authResult = await requirePermission("residents:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const residents = await prisma.resident.findMany({
      where: {
        societyId: context.societyId,
        deletedAt: null,
      },
      include: {
        flat: true,
        vehicles: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(residents);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch residents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requirePermission("residents:create");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const body = await request.json();

    const validated = residentSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const resident = await prisma.resident.create({
      data: {
        ...validated.data,
        societyId: context.societyId,
      },
      include: {
        flat: true,
      },
    });

    return NextResponse.json(resident, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create resident" }, { status: 500 });
  }
}
