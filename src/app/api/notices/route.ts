import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { noticeSchema } from "@/lib/validations";

export async function GET() {
  try {
    const authResult = await requirePermission("notices:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const notices = await prisma.notice.findMany({
      where: { societyId: context.societyId, deletedAt: null, isPublished: true },
      include: { creator: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notices);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requirePermission("notices:create");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const body = await request.json();
    const validated = noticeSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const notice = await prisma.notice.create({
      data: {
        ...validated.data,
        societyId: context.societyId,
        createdBy: context.userId,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
  }
}
