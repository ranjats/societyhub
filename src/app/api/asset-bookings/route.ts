import { NextResponse } from "next/server";
import { requireAuth, resolveResidentId } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { assetBookingSchema, assetRequestSchema } from "@/lib/validations";
import { notifyUsers, getCommitteeMemberIds } from "@/lib/notifications";

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const where: any = { societyId: context.societyId };

    // Residents only see their own bookings
    if (context.role === "RESIDENT") {
      const residentId = await resolveResidentId(context);
      if (!residentId) {
        return NextResponse.json(
          {
            error:
              "Your account is not linked to a flat yet. Please contact the committee to complete your profile.",
          },
          { status: 400 }
        );
      }
      where.residentId = residentId;
    }

    const bookings = await prisma.assetBooking.findMany({
      where,
      include: {
        asset: { select: { id: true, name: true, category: true } },
        resident: { select: { firstName: true, lastName: true, phone: true, flat: { select: { flatNumber: true } } } },
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

    // ---- Resident raises an asset request (awaits committee approval) ----
    if (context.role === "RESIDENT") {
      const validated = assetRequestSchema.safeParse(body);
      if (!validated.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validated.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      const { assetId, quantity, notes, pickupDate, expectedReturnDate } = validated.data;

      const residentId = await resolveResidentId(context);
      if (!residentId) {
        return NextResponse.json(
          {
            error:
              "Your account is not linked to a flat yet. Please contact the committee to complete your profile.",
          },
          { status: 400 }
        );
      }

      const asset = await prisma.asset.findFirst({
        where: { id: assetId, societyId: context.societyId, deletedAt: null },
      });
      if (!asset) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 });
      }
      if (!asset.isActive) {
        return NextResponse.json({ error: "This asset is not available for booking" }, { status: 400 });
      }
      if (asset.availableQuantity < quantity) {
        return NextResponse.json(
          { error: `Only ${asset.availableQuantity} unit(s) available` },
          { status: 400 }
        );
      }

      const booking = await prisma.assetBooking.create({
        data: {
          assetId,
          residentId,
          quantity,
          notes: notes || null,
          pickupDate,
          expectedReturnDate,
          societyId: context.societyId,
          status: "REQUESTED",
        },
        include: {
          asset: { select: { name: true } },
          resident: { select: { firstName: true, lastName: true } },
        },
      });

      // Notify all committee members about the new request
      const committeeIds = await getCommitteeMemberIds(context.societyId);
      await notifyUsers({
        userIds: committeeIds,
        title: "New Asset Request",
        message: `${booking.resident.firstName} ${booking.resident.lastName} requested ${quantity} × ${booking.asset.name} (pickup ${formatDate(
          pickupDate
        )}, return ${formatDate(expectedReturnDate)}). Review and approve it.`,
        type: "ASSET",
        link: "/assets",
      });

      return NextResponse.json(booking, { status: 201 });
    }

    // ---- Committee records a direct borrow ----
    const validated = assetBookingSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { assetId, quantity, notes, pickupDate, expectedReturnDate } = validated.data;

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
          pickupDate,
          expectedReturnDate,
          societyId: context.societyId,
          status: "ACTIVE",
          borrowDate: new Date(),
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
