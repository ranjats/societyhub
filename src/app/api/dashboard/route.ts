import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorization";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { context } = authResult;

    const { role, societyId, userId, residentId } = context;

    if (role === "RESIDENT") {
      const resident = residentId
        ? await prisma.resident.findUnique({
            where: { id: residentId },
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

      const pendingAmount = myCollections
        .filter((c) => c.status === "PENDING" || c.status === "OVERDUE")
        .reduce((sum, c) => sum + Number(c.amount), 0);

      return NextResponse.json({
        type: "resident",
        paymentStatus: pendingAmount === 0 ? "All Paid" : `${pendingAmount} Pending`,
        pendingAmount,
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
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
