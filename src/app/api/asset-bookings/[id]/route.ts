import { NextResponse } from "next/server";
import { requireAuth, resolveResidentId } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { notifyUsers, getCommitteeMemberIds, getResidentUserIds } from "@/lib/notifications";

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
    const { action } = body as { action?: string }; // approve | reject | return | complete | cancel

    // Find the booking and verify it belongs to the same society
    const booking = await prisma.assetBooking.findFirst({
      where: { id, societyId: context.societyId },
      include: {
        asset: { select: { id: true, name: true } },
        resident: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isCommittee = context.role === "COMMITTEE_MEMBER";
    const residentId = await resolveResidentId(context);

    // ---- Residents can only act on their own bookings ----
    if (!isCommittee && residentId !== booking.residentId) {
      return NextResponse.json({ error: "You can only manage your own bookings" }, { status: 403 });
    }

    // ---- Resident actions ----
    if (!isCommittee) {
      if (action === "return") {
        if (booking.status !== "APPROVED" && booking.status !== "ACTIVE") {
          return NextResponse.json({ error: "Only approved/active bookings can be returned" }, { status: 400 });
        }
        const updated = await prisma.assetBooking.update({
          where: { id },
          data: { status: "RETURNED", returnDate: new Date() },
          include: {
            asset: { select: { name: true } },
            resident: { select: { firstName: true, lastName: true } },
          },
        });

        const committeeIds = await getCommitteeMemberIds(context.societyId);
        await notifyUsers({
          userIds: committeeIds,
          title: "Asset Returned",
          message: `${updated.resident.firstName} ${updated.resident.lastName} marked ${updated.quantity} × ${updated.asset.name} as returned. Please verify and mark it done.`,
          type: "ASSET",
          link: "/assets",
        });
        return NextResponse.json(updated);
      }

      if (action === "cancel") {
        if (booking.status !== "REQUESTED" && booking.status !== "APPROVED" && booking.status !== "ACTIVE") {
          return NextResponse.json({ error: "This booking cannot be cancelled" }, { status: 400 });
        }
        // Restore inventory if the booking had been approved (stock already reserved)
        const restore =
          booking.status === "APPROVED" || booking.status === "ACTIVE";
        const updated = await prisma.assetBooking.update({
          where: { id },
          data: { status: "CANCELLED" },
          include: {
            asset: { select: { name: true } },
            resident: { select: { firstName: true, lastName: true } },
          },
        });
        if (restore) {
          await prisma.asset.update({
            where: { id: booking.asset.id },
            data: { availableQuantity: { increment: booking.quantity } },
          });
        }
        return NextResponse.json(updated);
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // ---- Committee actions ----
    if (action === "approve") {
      if (booking.status !== "REQUESTED") {
        return NextResponse.json({ error: "Only requested bookings can be approved" }, { status: 400 });
      }
      const asset = await prisma.asset.findFirst({
        where: { id: booking.asset.id, societyId: context.societyId, deletedAt: null },
      });
      if (!asset) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 });
      }
      // Atomic reservation — fails if stock was taken since the request
      const [updated, reserve] = await prisma.$transaction([
        prisma.assetBooking.update({
          where: { id },
          data: { status: "APPROVED", borrowDate: new Date() },
          include: {
            asset: { select: { name: true } },
            resident: { select: { firstName: true, lastName: true } },
          },
        }),
        prisma.asset.updateMany({
          where: { id: booking.asset.id, availableQuantity: { gte: booking.quantity } },
          data: { availableQuantity: { decrement: booking.quantity } },
        }),
      ]);

      if (reserve.count === 0) {
        // Revert the status change and surface a clear error
        await prisma.assetBooking.update({
          where: { id },
          data: { status: "REQUESTED" },
        });
        return NextResponse.json(
          { error: "Not enough units available right now. Reject the request or ask the resident to reduce the quantity." },
          { status: 400 }
        );
      }

      const residentUserIds = await getResidentUserIds([booking.residentId]);
      await notifyUsers({
        userIds: residentUserIds,
        title: "Asset Request Approved ✅",
        message: `Your request for ${booking.quantity} × ${booking.asset.name} has been approved. You can pick it up now.`,
        type: "ASSET",
        link: "/assets",
      });
      return NextResponse.json(updated);
    }

    if (action === "reject") {
      if (booking.status !== "REQUESTED") {
        return NextResponse.json({ error: "Only requested bookings can be rejected" }, { status: 400 });
      }
      const updated = await prisma.assetBooking.update({
        where: { id },
        data: { status: "REJECTED" },
        include: {
          asset: { select: { name: true } },
          resident: { select: { firstName: true, lastName: true } },
        },
      });

      const residentUserIds = await getResidentUserIds([booking.residentId]);
      await notifyUsers({
        userIds: residentUserIds,
        title: "Asset Request Rejected",
        message: `Your request for ${booking.quantity} × ${booking.asset.name} was not approved by the committee.`,
        type: "ASSET",
        link: "/assets",
      });
      return NextResponse.json(updated);
    }

    if (action === "complete") {
      if (booking.status !== "RETURNED") {
        return NextResponse.json({ error: "Only returned bookings can be completed" }, { status: 400 });
      }
      const [updated] = await prisma.$transaction([
        prisma.assetBooking.update({
          where: { id },
          data: { status: "COMPLETED" },
          include: {
            asset: { select: { name: true } },
            resident: { select: { firstName: true, lastName: true } },
          },
        }),
        prisma.asset.update({
          where: { id: booking.asset.id },
          data: { availableQuantity: { increment: booking.quantity } },
        }),
      ]);

      const residentUserIds = await getResidentUserIds([booking.residentId]);
      await notifyUsers({
        userIds: residentUserIds,
        title: "Booking Completed ✅",
        message: `Your return of ${booking.quantity} × ${booking.asset.name} has been confirmed by the committee. Thank you!`,
        type: "ASSET",
        link: "/assets",
      });
      return NextResponse.json(updated);
    }

    // Committee force-actions on approved/active bookings
    if (booking.status === "APPROVED" || booking.status === "ACTIVE") {
      if (action === "cancel") {
        // Restore stock — both statuses had it reserved at approval/borrow
        const [updated] = await prisma.$transaction([
          prisma.assetBooking.update({
            where: { id },
            data: { status: "CANCELLED" },
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

        const residentUserIds = await getResidentUserIds([booking.residentId]);
        await notifyUsers({
          userIds: residentUserIds,
          title: "Booking Cancelled",
          message: `Your booking of ${booking.quantity} × ${booking.asset.name} has been cancelled by the committee.`,
          type: "ASSET",
          link: "/assets",
        });
        return NextResponse.json(updated);
      }

      if (action === "return") {
        // Mark returned WITHOUT restoring stock — the committee confirms
        // with "complete", which is the single point where stock is restored.
        const updated = await prisma.assetBooking.update({
          where: { id },
          data: { status: "RETURNED", returnDate: new Date() },
          include: {
            asset: { select: { name: true } },
            resident: { select: { firstName: true, lastName: true } },
          },
        });

        const residentUserIds = await getResidentUserIds([booking.residentId]);
        await notifyUsers({
          userIds: residentUserIds,
          title: "Asset Marked Returned",
          message: `The committee marked your ${booking.quantity} × ${booking.asset.name} as returned.`,
          type: "ASSET",
          link: "/assets",
        });
        return NextResponse.json(updated);
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ error: "Booking is not active" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}


