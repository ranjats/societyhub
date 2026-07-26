import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { collectionSchema } from "@/lib/validations";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { id } = await params;

    const collection = await prisma.collection.findFirst({
      where: { id, societyId: context.societyId, deletedAt: null },
      include: { flat: true },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    return NextResponse.json(collection);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { id } = await params;

    const existing = await prisma.collection.findFirst({
      where: { id, societyId: context.societyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const body = await request.json();

    const validated = collectionSchema.partial().safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: validated.data,
      include: { flat: true },
    });

    return NextResponse.json(collection);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { id } = await params;

    const existing = await prisma.collection.findFirst({
      where: { id, societyId: context.societyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    await prisma.collection.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Collection deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
  }
}