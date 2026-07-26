import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validations";

export async function GET() {
  try {
    const authResult = await requirePermission("vehicles:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const where: any = { societyId: context.societyId, deletedAt: null };

    if (context.role === "RESIDENT" && context.residentId) {
      where.residentId = context.residentId;
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: { resident: { select: { firstName: true, lastName: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requirePermission("vehicles:create");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const body = await request.json();
    const validated = vehicleSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { residentId, ...vehicleData } = validated.data;
    const targetResidentId = context.role === "RESIDENT" ? context.residentId : residentId;

    if (!targetResidentId) {
      return NextResponse.json({ error: "Resident is required" }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.create({
      data: { ...vehicleData, societyId: context.societyId, residentId: targetResidentId },
      include: { resident: { select: { firstName: true, lastName: true } } },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 });
  }
}
