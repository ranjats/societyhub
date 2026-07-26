import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { expenseSchema } from "@/lib/validations";

export async function GET() {
  try {
    const authResult = await requirePermission("expenses:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const expenses = await prisma.expense.findMany({
      where: { societyId: context.societyId, deletedAt: null },
      include: { creator: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requirePermission("expenses:create");
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const body = await request.json();
    const validated = expenseSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: { ...validated.data, societyId: context.societyId, createdBy: context.userId },
      include: { creator: { select: { firstName: true, lastName: true, email: true } } },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
