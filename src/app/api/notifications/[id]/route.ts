import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";

interface Params { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("notifications:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const existing = await prisma.notification.findFirst({ where: { id, userId: context.userId } });
    if (!existing) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

    const notification = await prisma.notification.update({ where: { id }, data: { isRead: true } });
    return NextResponse.json(notification);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("notifications:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const existing = await prisma.notification.findFirst({ where: { id, userId: context.userId } });
    if (!existing) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ message: "Notification deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
