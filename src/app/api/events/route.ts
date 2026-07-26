import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { eventSchema } from "@/lib/validations";

export async function GET() {
  try {
    const authResult = await requirePermission("events:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const events = await prisma.event.findMany({
      where: { societyId: context.societyId, deletedAt: null },
      include: { creator: { select: { firstName: true, lastName: true } } },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(events);
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
