import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { noticeSchema } from "@/lib/validations";

interface Params { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("notices:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const notice = await prisma.notice.findFirst({
      where: { id, societyId: context.societyId, deletedAt: null },
      include: { creator: { select: { firstName: true, lastName: true } } },
    });
    if (!notice) return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    return NextResponse.json(notice);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notice" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("notices:edit");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const existing = await prisma.notice.findFirst({ where: { id, societyId: context.societyId, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: "Notice not found" }, { status: 404 });

    const body = await request.json();
    const validated = noticeSchema.partial().safeParse(body);
    if (!validated.success) return NextResponse.json({ error: "Validation failed", details: validated.error.flatten().fieldErrors }, { status: 400 });

    const notice = await prisma.notice.update({ where: { id }, data: validated.data });
    return NextResponse.json(notice);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notice" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("notices:delete");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const existing = await prisma.notice.findFirst({ where: { id, societyId: context.societyId, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: "Notice not found" }, { status: 404 });

    await prisma.notice.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ message: "Notice deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete notice" }, { status: 500 });
  }
}
