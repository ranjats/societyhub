import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorization";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        resident: {
          select: {
            phone: true,
            ownershipType: true,
            flat: {
              select: {
                flatNumber: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      phone: user.resident?.phone || user.phone || null,
      flatNumber: user.resident?.flat?.flatNumber || null,
      ownershipType: user.resident?.ownershipType || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
