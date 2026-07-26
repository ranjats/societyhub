import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { collectionSchema } from "@/lib/validations";

export async function GET() {
  try {
    const authResult = await requirePermission("collections:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const where: any = {
      societyId: context.societyId,
      deletedAt: null,
    };

    // If resident, only show their flat's collections
    if (context.role === "RESIDENT" && context.residentId) {
      const resident = await prisma.resident.findUnique({
        where: { id: context.residentId },
        select: { flatId: true },
      });
      if (resident) {
        where.flatId = resident.flatId;
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
    const authResult = await requirePermission("collections:create");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const body = await request.json();

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
