import { NextResponse } from "next/server";
import { requireAuth, requirePermission, resolveResidentId } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { collectionSchema, paymentSubmissionSchema } from "@/lib/validations";
import { notifyUsers, getCommitteeMemberIds } from "@/lib/notifications";

const monthName = (m: number) =>
  new Date(2024, m - 1).toLocaleString("default", { month: "long" });

export async function GET() {
  try {
    // Both committee (all flats) and residents (own flat only) can view
    // collections; residents are filtered to their flat below.
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const where: any = {
      societyId: context.societyId,
      deletedAt: null,
    };

    // If resident, only show their flat's collections
    if (context.role === "RESIDENT") {
      const residentId = await resolveResidentId(context);
      if (residentId) {
        const resident = await prisma.resident.findUnique({
          where: { id: residentId },
          select: { flatId: true },
        });
        if (resident) {
          where.flatId = resident.flatId;
        }
      }
    }

    const collections = await prisma.collection.findMany({
      where,
      include: {
        flat: { select: { id: true, flatNumber: true, floor: true } },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json(collections);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const body = await request.json();

    // ---- Resident payment submission (pay committee → submit details → await approval) ----
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

      const validated = paymentSubmissionSchema.safeParse(body);
      if (!validated.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validated.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      const { month, year, amount, notes, paymentMethod } = validated.data;

      const resident = await prisma.resident.findUnique({
        where: { id: residentId },
        select: { flatId: true },
      });
      if (!resident) {
        return NextResponse.json({ error: "Resident not found" }, { status: 404 });
      }

      // One collection per flat + month + year — reuse the existing due if present
      const existing = await prisma.collection.findFirst({
        where: {
          societyId: context.societyId,
          flatId: resident.flatId,
          month,
          year,
          deletedAt: null,
        },
      });

      if (existing?.status === "PAID") {
        return NextResponse.json(
          {
            error: `Maintenance for ${monthName(month)} ${year} is already marked as paid${
              existing.receiptNumber ? ` (Receipt ${existing.receiptNumber})` : ""
            }.`,
          },
          { status: 409 }
        );
      }

      const submissionData = {
        amount,
        notes: notes || null,
        paymentMethod: paymentMethod || null,
        status: "SUBMITTED" as const,
        submittedAt: new Date(),
      };

      const collection = existing
        ? await prisma.collection.update({
            where: { id: existing.id },
            data: submissionData,
            include: { flat: { select: { flatNumber: true } } },
          })
        : await prisma.collection.create({
            data: {
              ...submissionData,
              dueDate: new Date(year, month - 1, 10),
              month,
              year,
              flatId: resident.flatId,
              societyId: context.societyId,
            },
            include: { flat: { select: { flatNumber: true } } },
          });

      // Notify all committee members about the new submission
      const committeeIds = await getCommitteeMemberIds(context.societyId);
      await notifyUsers({
        userIds: committeeIds,
        title: "New Payment Submission",
        message: `Flat ${collection.flat.flatNumber} submitted ₹${Number(
          collection.amount
        ).toLocaleString("en-IN")} for ${monthName(month)} ${year}. Review and approve it.`,
        type: "COLLECTION",
        link: "/collections",
      });

      return NextResponse.json(collection, { status: 201 });
    }

    // ---- Committee records a payment directly ----
    const permResult = await requirePermission("collections:create");
    if (permResult.error) return permResult.error;

    const validated = collectionSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const collection = await prisma.collection.create({
      data: {
        ...validated.data,
        societyId: context.societyId,
        collectedBy: context.userId,
      },
      include: {
        flat: true,
      },
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}
