import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import type { AssetBookingStatus } from "@prisma/client";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // "return" or "cancel"

    // Find the booking and verify it belongs to the same society
    const booking = await prisma.assetBooking.findFirst({
      where: { id, societyId: context.societyId },
      include: { asset: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "ACTIVE") {
      return NextResponse.json({ error: "Booking is not active" }, { status: 400 });
    }

    const newStatus = action === "cancel" ? "CANCELLED" : "RETURNED";

    // Update booking status and restore available quantity in a transaction
    const [updatedBooking] = await prisma.$transaction([
      prisma.assetBooking.update({
        where: { id },
        data: {
          status: newStatus as AssetBookingStatus,
          returnDate: new Date(),
        },
        include: {
          asset: { select: { name: true } },
          resident: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.asset.update({
        where: { id: booking.assetId },
        data: { availableQuantity: { increment: booking.quantity } },
      }),
    ]);

    return NextResponse.json(updatedBooking);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
