import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

// Approve a pending resident
export async function PUT(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("residents:edit");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // "approve" or "reject"

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Find the resident
    const resident = await prisma.resident.findFirst({
      where: {
        id,
        societyId: context.societyId,
        deletedAt: null,
      },
      include: { user: true },
    });

    if (!resident) {
      return NextResponse.json(
        { error: "Resident not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      // Activate the resident and user
      await prisma.resident.update({
        where: { id },
        data: { isActive: true },
      });

      if (resident.user) {
        await prisma.user.update({
          where: { id: resident.user.id },
          data: { isActive: true },
        });
      }

      return NextResponse.json({
        message: `${resident.firstName} ${resident.lastName} has been approved`,
      });
    } else {
      // Reject: deactivate but allow re-registration
      await prisma.resident.update({
        where: { id },
        data: { isActive: false },
      });

      if (resident.user) {
        await prisma.user.update({
          where: { id: resident.user.id },
          data: { isActive: false, residentId: null },
        });
      }

      return NextResponse.json({
        message: `${resident.firstName} ${resident.lastName}'s registration has been rejected`,
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
