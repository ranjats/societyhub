import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const authResult = await requirePermission("notifications:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const notifications = await prisma.notification.findMany({
      where: { userId: context.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
