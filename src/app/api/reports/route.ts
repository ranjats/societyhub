import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorization";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { societyId } = context;

    // Total collection (sum of all PAID collections)
    const paidCollections = await prisma.collection.aggregate({
      where: { societyId, deletedAt: null, status: "PAID" },
      _sum: { amount: true },
    });

    // Total expenses
    const totalExpenses = await prisma.expense.aggregate({
      where: { societyId, deletedAt: null },
      _sum: { amount: true },
    });

    // Pending dues (sum of PENDING and OVERDUE collections)
    const pendingDues = await prisma.collection.aggregate({
      where: {
        societyId,
        deletedAt: null,
        status: { in: ["PENDING", "OVERDUE"] },
      },
      _sum: { amount: true },
    });

    // Total residents
    const totalResidents = await prisma.resident.count({
      where: { societyId, deletedAt: null, isActive: true },
    });

    // Total flats
    const totalFlats = await prisma.flat.count({
      where: { societyId, deletedAt: null },
    });

    // Occupied flats
    const occupiedFlats = await prisma.flat.count({
      where: { societyId, deletedAt: null, status: "OCCUPIED" },
    });

    // Total collections (for rate calculation)
    const totalCollections = await prisma.collection.count({
      where: { societyId, deletedAt: null },
    });

    // Paid collections count (for rate calculation)
    const paidCollectionsCount = await prisma.collection.count({
      where: { societyId, deletedAt: null, status: "PAID" },
    });

    // Expense breakdown by category
    const expensesByCategory = await prisma.expense.groupBy({
      by: ["category"],
      where: { societyId, deletedAt: null },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    });

    // Calculate rates
    const collectionRate =
      totalCollections > 0
        ? Math.round((paidCollectionsCount / totalCollections) * 100)
        : 0;

    const occupancyRate =
      totalFlats > 0 ? Math.round((occupiedFlats / totalFlats) * 100) : 0;

    return NextResponse.json({
      totalCollection: Number(paidCollections._sum.amount || 0),
      totalExpenses: Number(totalExpenses._sum.amount || 0),
      pendingDues: Number(pendingDues._sum.amount || 0),
      totalResidents,
      totalFlats,
      occupiedFlats,
      collectionRate,
      occupancyRate,
      expensesByCategory: expensesByCategory.map((e) => ({
        category: e.category,
        amount: Number(e._sum.amount || 0),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch reports data" },
      { status: 500 }
    );
  }
}
