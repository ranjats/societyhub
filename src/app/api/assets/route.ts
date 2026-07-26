import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { assetSchema } from "@/lib/validations";

export async function GET() {
  try {
    const authResult = await requirePermission("assets:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const assets = await prisma.asset.findMany({
      where: { societyId: context.societyId, deletedAt: null },
      include: {
        bookings: {
          where: { status: "ACTIVE" },
          include: { resident: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assets);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requirePermission("assets:create");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const body = await request.json();
    const validated = assetSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { totalQuantity, ...rest } = validated.data;
    const asset = await prisma.asset.create({
      data: {
        ...rest,
        totalQuantity,
        availableQuantity: totalQuantity,
        societyId: context.societyId,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
  }
}
