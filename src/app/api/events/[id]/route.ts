import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { eventSchema } from "@/lib/validations";

interface Params { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("events:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const event = await prisma.event.findFirst({
      where: { id, societyId: context.societyId, deletedAt: null },
      include: { creator: { select: { firstName: true, lastName: true } } },
    });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("events:edit");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const existing = await prisma.event.findFirst({ where: { id, societyId: context.societyId, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const body = await request.json();
    const validated = eventSchema.partial().safeParse(body);
    if (!validated.success) return NextResponse.json({ error: "Validation failed", details: validated.error.flatten().fieldErrors }, { status: 400 });

    const event = await prisma.event.update({ where: { id }, data: validated.data });
    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("events:delete");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const existing = await prisma.event.findFirst({ where: { id, societyId: context.societyId, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    await prisma.event.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
