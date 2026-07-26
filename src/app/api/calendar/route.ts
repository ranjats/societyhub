import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const authResult = await requirePermission("calendar:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const events = await prisma.calendarEvent.findMany({
      where: { societyId: context.societyId, deletedAt: null },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requirePermission("calendar:create");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const body = await request.json();
    const event = await prisma.calendarEvent.create({
      data: { ...body, societyId: context.societyId },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 });
  }
}
