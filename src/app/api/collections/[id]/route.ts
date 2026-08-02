import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { collectionSchema } from "@/lib/validations";
import { notifyUsers } from "@/lib/notifications";

interface Params {
  params: Promise<{ id: string }>;
}

const monthName = (m: number) =>
  new Date(2024, m - 1).toLocaleString("default", { month: "long" });

/** User IDs of residents living in the given flat. */
async function getResidentUserIds(societyId: string, flatId: string) {
  const users = await prisma.user.findMany({
    where: {
      societyId,
      role: "RESIDENT",
      isActive: true,
      deletedAt: null,
      resident: { flatId },
    },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

export async function GET(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("collections:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { id } = await params;

    const collection = await prisma.collection.findFirst({
      where: { id, societyId: context.societyId, deletedAt: null },
      include: { flat: true },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    return NextResponse.json(collection);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("collections:edit");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { id } = await params;

    const existing = await prisma.collection.findFirst({
      where: { id, societyId: context.societyId, deletedAt: null },
      include: { flat: { select: { flatNumber: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const body = await request.json();

    // ---- Approve / reject a resident's payment submission ----
    if (body.action === "approve" || body.action === "reject") {
      if (existing.status !== "SUBMITTED") {
        return NextResponse.json(
          { error: "Only submitted payments can be approved or rejected." },
          { status: 400 }
        );
      }

      const residentUserIds = await getResidentUserIds(
        context.societyId,
        existing.flatId
      );
      const periodLabel = `${monthName(existing.month)} ${existing.year}`;
      const amountLabel = Number(existing.amount).toLocaleString("en-IN");

      if (body.action === "approve") {
        const receiptNumber = `REC-${existing.month}-${existing.year}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;

        const collection = await prisma.collection.update({
          where: { id },
          data: {
            status: "PAID",
            paidDate: new Date(),
            receiptNumber,
            collectedBy: context.userId,
          },
          include: { flat: true },
        });

        await notifyUsers({
          userIds: residentUserIds,
          title: "Payment Approved ✅",
          message: `Your payment of ₹${amountLabel} for ${periodLabel} has been approved. Receipt: ${receiptNumber}`,
          type: "COLLECTION",
          link: "/payments",
        });

        return NextResponse.json(collection);
      }

      // Reject — revert to a pending due so the resident can re-submit
      const collection = await prisma.collection.update({
        where: { id },
        data: { status: "PENDING", submittedAt: null },
        include: { flat: true },
      });

      await notifyUsers({
        userIds: residentUserIds,
        title: "Payment Submission Rejected",
        message: `Your payment submission of ₹${amountLabel} for ${periodLabel} was rejected. Please contact the committee or re-submit the details.`,
        type: "COLLECTION",
        link: "/payments",
      });

      return NextResponse.json(collection);
    }

    // ---- General partial update (committee only) ----
    const validated = collectionSchema.partial().safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: validated.data,
      include: { flat: true },
    });

    return NextResponse.json(collection);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("collections:delete");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { id } = await params;

    const existing = await prisma.collection.findFirst({
      where: { id, societyId: context.societyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    await prisma.collection.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Collection deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
  }
}
