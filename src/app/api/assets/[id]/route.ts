import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { assetSchema } from "@/lib/validations";

interface Params { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("assets:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const asset = await prisma.asset.findFirst({ where: { id, societyId: context.societyId, deletedAt: null } });
    if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    return NextResponse.json(asset);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch asset" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("assets:edit");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const existing = await prisma.asset.findFirst({ where: { id, societyId: context.societyId, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    const body = await request.json();
    const validated = assetSchema.partial().safeParse(body);
    if (!validated.success) return NextResponse.json({ error: "Validation failed", details: validated.error.flatten().fieldErrors }, { status: 400 });

    const asset = await prisma.asset.update({ where: { id }, data: validated.data });
    return NextResponse.json(asset);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("assets:delete");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const existing = await prisma.asset.findFirst({ where: { id, societyId: context.societyId, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    await prisma.asset.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ message: "Asset deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
  }
}
