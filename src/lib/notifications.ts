import prisma from "@/lib/prisma";

export type NotificationType =
  | "COLLECTION"
  | "EVENT"
  | "NOTICE"
  | "EXPENSE"
  | "ASSET"
  | "GENERAL";

interface CreateNotificationParams {
  userIds: string[];
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}

/**
 * Create in-app notifications for multiple users in a single write.
 */
export async function notifyUsers({
  userIds,
  title,
  message,
  type = "GENERAL",
  link,
}: CreateNotificationParams): Promise<void> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return;

  await prisma.notification.createMany({
    data: uniqueIds.map((userId) => ({
      userId,
      title,
      message,
      type,
      link,
    })),
  });
}

/**
 * Get the user IDs of all active committee members in a society.
 */
export async function getCommitteeMemberIds(societyId: string): Promise<string[]> {
  const members = await prisma.user.findMany({
    where: {
      societyId,
      role: "COMMITTEE_MEMBER",
      isActive: true,
      deletedAt: null,
    },
    select: { id: true },
  });
  return members.map((m) => m.id);
}

/**
 * Get the user account IDs linked to the given resident records.
 */
export async function getResidentUserIds(residentIds: string[]): Promise<string[]> {
  const unique = [...new Set(residentIds.filter(Boolean))];
  if (unique.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { residentId: { in: unique }, isActive: true, deletedAt: null },
    select: { id: true },
  });
  return users.map((u) => u.id);
}
