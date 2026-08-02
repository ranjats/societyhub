import { NextResponse } from "next/server";
import { requireAuth, resolveResidentId } from "@/lib/authorization";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { role, societyId, userId } = context;

    if (role === "RESIDENT") {
      const resolvedResidentId = await resolveResidentId(context);
      const resident = resolvedResidentId
        ? await prisma.resident.findUnique({
            where: { id: resolvedResidentId },
            include: { flat: true, vehicles: true },
          })
        : null;

      const myCollections = resident?.flatId
        ? await prisma.collection.findMany({
            where: { flatId: resident.flatId, deletedAt: null },
            orderBy: [{ year: "desc" }, { month: "desc" }],
          })
        : [];

      const upcomingEvents = await prisma.event.findMany({
        where: {
          societyId,
          deletedAt: null,
          status: "UPCOMING",
          startDate: { gte: new Date() },
        },
        orderBy: { startDate: "asc" },
        take: 5,
      });

      const latestNotices = await prisma.notice.findMany({
        where: { societyId, deletedAt: null, isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      const calendarEvents = await prisma.calendarEvent.findMany({
        where: { societyId, deletedAt: null, startDate: { gte: new Date() } },
        orderBy: { startDate: "asc" },
        take: 5,
      });

      const notifications = await prisma.notification.findMany({
        where: { userId, isRead: false },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      const committeeMembers = await prisma.user.findMany({
        where: {
          societyId,
          role: "COMMITTEE_MEMBER",
          isActive: true,
          deletedAt: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          lastLoginAt: true,
        },
        orderBy: { firstName: "asc" },
      });

      const pendingAmount = myCollections
        .filter((c) => c.status === "PENDING" || c.status === "OVERDUE")
        .reduce((sum, c) => sum + Number(c.amount), 0);

      const submittedAmount = myCollections
        .filter((c) => c.status === "SUBMITTED")
        .reduce((sum, c) => sum + Number(c.amount), 0);

      return NextResponse.json({
        type: "resident",
        paymentStatus:
          pendingAmount > 0
            ? "Dues Pending"
            : submittedAmount > 0
            ? "Awaiting Approval"
            : "All Paid",
        pendingAmount,
        submittedAmount,
        upcomingEvents: upcomingEvents.length,
        latestNotices: latestNotices.length,
        upcomingCalendarEvents: calendarEvents.length,
        myVehicles: resident?.vehicles?.length || 0,
        collections: myCollections,
        upcomingEventsList: upcomingEvents,
        latestNoticesList: latestNotices,
        calendarEventsList: calendarEvents,
        notifications,
        vehicleList: resident?.vehicles || [],
        committeeMembers,
      });
    }

    // Admin/Committee dashboard
    const totalFlats = await prisma.flat.count({
      where: { societyId, deletedAt: null },
    });
    const totalResidents = await prisma.resident.count({
      where: { societyId, deletedAt: null, isActive: true },
    });

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const monthlyCollections = await prisma.collection.findMany({
      where: { societyId, deletedAt: null, month: currentMonth, year: currentYear },
    });

    const monthlyCollection = monthlyCollections
      .filter((c) => c.status === "PAID")
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const pendingCollection = monthlyCollections
      .filter((c) => c.status === "PENDING" || c.status === "OVERDUE")
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const totalExpenses = await prisma.expense.aggregate({
      where: { societyId, deletedAt: null },
      _sum: { amount: true },
    });

    const upcomingEvents = await prisma.event.count({
      where: { societyId, deletedAt: null, startDate: { gte: new Date() } },
    });

    const activeNotices = await prisma.notice.count({
      where: { societyId, deletedAt: null, isPublished: true },
    });

    const totalAssets = await prisma.asset.count({
      where: { societyId, deletedAt: null },
    });

    const recentCollections = await prisma.collection.findMany({
      where: { societyId, deletedAt: null },
      include: { flat: { select: { flatNumber: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const recentExpenses = await prisma.expense.findMany({
      where: { societyId, deletedAt: null },
      include: { creator: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const eventsList = await prisma.event.findMany({
      where: { societyId, deletedAt: null, startDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      take: 5,
    });

    // Collection trend — last 6 months (collected vs pending)
    const now = new Date();
    const trendMonths: { month: number; year: number; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      trendMonths.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: d.toLocaleString("default", { month: "short" }),
      });
    }

    const trendStart = trendMonths[0];
    const trendCollections = await prisma.collection.findMany({
      where: {
        societyId,
        deletedAt: null,
        OR: [
          { year: trendStart.year, month: { gte: trendStart.month } },
          { year: { gt: trendStart.year } },
        ],
      },
      select: { month: true, year: true, amount: true, status: true },
    });

    const collectionTrend = trendMonths.map((m) => {
      const key = `${m.year}-${m.month}`;
      const monthCollections = trendCollections.filter(
        (c) => `${c.year}-${c.month}` === key
      );
      return {
        month: m.label,
        collected: Number(
          monthCollections
            .filter((c) => c.status === "PAID")
            .reduce((sum, c) => sum + Number(c.amount), 0)
        ),
        pending: Number(
          monthCollections
            .filter((c) => c.status === "PENDING" || c.status === "OVERDUE")
            .reduce((sum, c) => sum + Number(c.amount), 0)
        ),
      };
    });

    // Expense trend — last 6 months (paid vs pending), bucketed by createdAt
    const trendStartDate = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1
    );
    const trendExpenses = await prisma.expense.findMany({
      where: { societyId, deletedAt: null, createdAt: { gte: trendStartDate } },
      select: { amount: true, status: true, createdAt: true },
    });

    const expenseTrend = trendMonths.map((m) => {
      const monthExpenses = trendExpenses.filter((e) => {
        const d = new Date(e.createdAt);
        return d.getMonth() + 1 === m.month && d.getFullYear() === m.year;
      });
      return {
        month: m.label,
        paid: Number(
          monthExpenses
            .filter((e) => e.status === "PAID")
            .reduce((sum, e) => sum + Number(e.amount), 0)
        ),
        pending: Number(
          monthExpenses
            .filter((e) => e.status === "PENDING" || e.status === "APPROVED")
            .reduce((sum, e) => sum + Number(e.amount), 0)
        ),
      };
    });

    return NextResponse.json({
      type: "admin",
      totalFlats,
      totalResidents,
      monthlyCollection,
      pendingCollection,
      totalExpenses: Number(totalExpenses._sum.amount || 0),
      upcomingEvents,
      activeNotices,
      totalAssets,
      recentCollections,
      recentExpenses,
      eventsList,
      collectionTrend,
      expenseTrend,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
