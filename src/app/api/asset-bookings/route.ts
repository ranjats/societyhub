import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorization";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const where: any = { societyId: context.societyId };
    if (context.role === "RESIDENT" && context.residentId) {
      where.residentId = context.residentId;
    }

    const bookings = await prisma.assetBooking.findMany({
      where,
      include: {
        asset: { select: { id: true, name: true, category: true } },
        resident: { select: { firstName: true, lastName: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const body = await request.json();
    const { assetId, quantity = 1, notes } = body;

    if (!assetId) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }

    // Get the asset and verify it belongs to the same society
    const asset = await prisma.asset.findFirst({
      where: { id: assetId, societyId: context.societyId, deletedAt: null },
    });
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Check availability
    if (asset.availableQuantity < quantity) {
      return NextResponse.json(
        { error: `Only ${asset.availableQuantity} units available` },
        { status: 400 }
      );
    }

    // Get resident ID and verify it belongs to the same society
    let residentId = context.residentId;
    if (!residentId && body.residentId) {
      residentId = body.residentId;
    }
    if (!residentId) {
      return NextResponse.json({ error: "Resident ID is required" }, { status: 400 });
    }

    // Verify resident belongs to the same society
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, societyId: context.societyId },
    });
    if (!resident) {
      return NextResponse.json({ error: "Resident not found in this society" }, { status: 404 });
    }

    // Create booking and update available quantity in a transaction
    const [booking] = await prisma.$transaction([
      prisma.assetBooking.create({
        data: {
          assetId,
          residentId,
          quantity,
          notes,
          societyId: context.societyId,
          status: "ACTIVE",
        },
        include: {
          asset: { select: { name: true } },
          resident: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.asset.update({
        where: { id: assetId },
        data: { availableQuantity: { decrement: quantity } },
      }),
    ]);

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
