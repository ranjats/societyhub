import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const authResult = await requirePermission("residents:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    // Get inactive residents (pending approval) for this society
    const pendingResidents = await prisma.resident.findMany({
      where: {
        societyId: context.societyId,
        isActive: false,
        deletedAt: null,
      },
      include: {
        flat: {
          select: { flatNumber: true, floor: true },
        },
        user: {
          select: { id: true, email: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(pendingResidents);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch pending residents" },
      { status: 500 }
    );
  }
}
