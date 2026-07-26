import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import { expenseSchema } from "@/lib/validations";

interface Params { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("expenses:view");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const expense = await prisma.expense.findFirst({
      where: { id, societyId: context.societyId, deletedAt: null },
      include: { creator: { select: { firstName: true, lastName: true, email: true } } },
    });
    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch expense" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("expenses:edit");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const existing = await prisma.expense.findFirst({ where: { id, societyId: context.societyId, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    const body = await request.json();
    const validated = expenseSchema.partial().safeParse(body);
    if (!validated.success) return NextResponse.json({ error: "Validation failed", details: validated.error.flatten().fieldErrors }, { status: 400 });

    const expense = await prisma.expense.update({ where: { id }, data: validated.data, include: { creator: { select: { firstName: true, lastName: true } } } });
    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const authResult = await requirePermission("expenses:delete");
    if (authResult.error) return authResult.error;
    const { context } = authResult;
    const { id } = await params;

    const existing = await prisma.expense.findFirst({ where: { id, societyId: context.societyId, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    await prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
