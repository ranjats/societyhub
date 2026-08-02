import { NextResponse } from "next/server";
import { requirePermission, resolveResidentId } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { eventSchema } from "@/lib/validations";

export async function GET() {
  try {
    const authResult = await requirePermission("events:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const residentId = await resolveResidentId(context);
    const isCommittee = context.role === "COMMITTEE_MEMBER";

    // Committee sees full resident contact details for the participants table;
    // residents only see name + flat (privacy).
    const participantResidentSelect = isCommittee
      ? {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          gender: true,
          ownershipType: true,
          flat: { select: { flatNumber: true } },
        }
      : {
          id: true,
          firstName: true,
          lastName: true,
          flat: { select: { flatNumber: true } },
        };

    const events = await prisma.event.findMany({
      where: { societyId: context.societyId, deletedAt: null },
      include: {
        creator: { select: { firstName: true, lastName: true } },
        participants: {
          include: {
            resident: { select: participantResidentSelect },
          },
        },
      },
      orderBy: { startDate: "asc" },
    });

    // Attach the logged-in user's own participation (null for committee/guests)
    const withMine = events.map((event) => ({
      ...event,
      myParticipation:
        event.participants.find((p) => p.residentId === residentId) ?? null,
    }));

    return NextResponse.json(withMine);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requirePermission("events:create");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const body = await request.json();
    const validated = eventSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: { ...validated.data, societyId: context.societyId, createdBy: context.userId },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
