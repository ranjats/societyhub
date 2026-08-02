import { NextResponse } from "next/server";
import { requireAuth, resolveResidentId } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { eventParticipationSchema } from "@/lib/validations";

interface Params { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { id } = await params;

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

    // Event must belong to the same society
    const event = await prisma.event.findFirst({
      where: { id, societyId: context.societyId, deletedAt: null },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Only upcoming/ongoing events accept new participation
    if (event.status !== "UPCOMING" && event.status !== "ONGOING") {
      return NextResponse.json(
        { error: "Participation is closed for this event" },
        { status: 400 }
      );
    }

    // Resident must belong to the same society
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, societyId: context.societyId },
    });
    if (!resident) {
      return NextResponse.json({ error: "Resident not found in this society" }, { status: 404 });
    }

    const body = await request.json();
    const validated = eventParticipationSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { maleCount, femaleCount, childrenCount, notes } = validated.data;

    if (maleCount + femaleCount + childrenCount === 0) {
      return NextResponse.json(
        { error: "Add at least one attendee to participate" },
        { status: 400 }
      );
    }

    const participation = await prisma.eventParticipant.upsert({
      where: { eventId_residentId: { eventId: id, residentId } },
      create: {
        eventId: id,
        residentId,
        maleCount,
        femaleCount,
        childrenCount,
        notes: notes || null,
      },
      update: { maleCount, femaleCount, childrenCount, notes: notes || null },
      include: {
        resident: {
          select: { firstName: true, lastName: true, flat: { select: { flatNumber: true } } },
        },
      },
    });

    return NextResponse.json(participation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save participation" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { id } = await params;

    const residentId = await resolveResidentId(context);
    if (!residentId) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    const participation = await prisma.eventParticipant.findFirst({
      where: { eventId: id, residentId },
    });
    if (!participation) {
      return NextResponse.json({ error: "You are not participating in this event" }, { status: 404 });
    }

    await prisma.eventParticipant.delete({ where: { id: participation.id } });
    return NextResponse.json({ message: "Participation withdrawn" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to withdraw participation" }, { status: 500 });
  }
}
