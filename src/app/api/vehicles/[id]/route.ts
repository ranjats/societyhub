import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validations";

interface Params { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("vehicles:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const vehicle = await prisma.vehicle.findFirst({
      where: { id, societyId: context.societyId, deletedAt: null },
      include: { resident: { select: { firstName: true, lastName: true, phone: true } } },
    });
    if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

    if (context.role === "RESIDENT" && vehicle.residentId !== context.residentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch vehicle" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("vehicles:edit");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const existing = await prisma.vehicle.findFirst({ where: { id, societyId: context.societyId, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

    if (context.role === "RESIDENT" && existing.residentId !== context.residentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = vehicleSchema.partial().safeParse(body);
    if (!validated.success) return NextResponse.json({ error: "Validation failed", details: validated.error.flatten().fieldErrors }, { status: 400 });

    const vehicle = await prisma.vehicle.update({ where: { id }, data: validated.data, include: { resident: { select: { firstName: true, lastName: true } } } });
    return NextResponse.json(vehicle);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("vehicles:delete");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const existing = await prisma.vehicle.findFirst({ where: { id, societyId: context.societyId, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

    if (context.role === "RESIDENT" && existing.residentId !== context.residentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.vehicle.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete vehicle" }, { status: 500 });
  }
}
