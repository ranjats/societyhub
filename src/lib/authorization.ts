import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Role hierarchy for permission checking
const ROLE_HIERARCHY: Record<string, string[]> = {
  COMMITTEE_MEMBER: ["COMMITTEE_MEMBER", "RESIDENT"],
  RESIDENT: ["RESIDENT"],
};

// Permission definitions for each role
const ROLE_PERMISSIONS: Record<string, string[]> = {
  COMMITTEE_MEMBER: [
    "dashboard:view",
    "residents:view",
    "residents:create",
    "residents:edit",
    "residents:delete",
    "flats:view",
    "flats:create",
    "flats:edit",
    "flats:delete",
    "collections:view",
    "collections:create",
    "collections:edit",
    "collections:delete",
    "expenses:view",
    "expenses:create",
    "expenses:edit",
    "expenses:delete",
    "events:view",
    "events:create",
    "events:edit",
    "events:delete",
    "notices:view",
    "notices:create",
    "notices:edit",
    "notices:delete",
    "assets:view",
    "assets:create",
    "assets:edit",
    "assets:delete",
    "calendar:view",
    "calendar:create",
    "calendar:edit",
    "calendar:delete",
    "vehicles:view",
    "vehicles:create",
    "vehicles:edit",
    "vehicles:delete",
    "reports:view",
    "notifications:view",
    "users:view",
    "users:create",
    "users:edit",
    "users:delete",
    "settings:view",
    "settings:edit",
  ],
  RESIDENT: [
    "dashboard:view",
    "profile:view",
    "profile:edit",
    "payments:view",
    "events:view",
    "notices:view",
    "calendar:view",
    "vehicles:view",
    "vehicles:create",
    "vehicles:edit",
    "notifications:view",
  ],
};

export interface AuthContext {
  userId: string;
  role: string;
  societyId: string;
  residentId?: string;
}

/**
 * Get the current user's auth context from the session.
 * Returns null if not authenticated.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth();
  if (!session?.user) return null;

  return {
    userId: session.user.id!,
    role: session.user.role,
    societyId: session.user.societyId,
    residentId: session.user.residentId,
  };
}

/**
 * Check if the user has a specific permission.
 */
export function hasPermission(role: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if the user's role is at least the required role level.
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
  const hierarchy = ROLE_HIERARCHY[userRole] || [];
  return hierarchy.includes(requiredRole);
}

/**
 * Require authentication and return auth context or 401 response.
 */
export async function requireAuth(): Promise<
  { context: AuthContext; error?: never } | { context?: never; error: NextResponse }
> {
  const context = await getAuthContext();
  if (!context) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { context };
}

/**
 * Require a specific role level and return auth context or 403 response.
 */
export async function requireRole(
  requiredRole: string
): Promise<
  { context: AuthContext; error?: never } | { context?: never; error: NextResponse }
> {
  const authResult = await requireAuth();
  if (authResult.error) return authResult;

  if (!hasRole(authResult.context.role, requiredRole)) {
    return {
      error: NextResponse.json(
        { error: "Forbidden", requiredRole, currentRole: authResult.context.role },
        { status: 403 }
      ),
    };
  }

  return { context: authResult.context };
}

/**
 * Require a specific permission and return auth context or 403 response.
 */
export async function requirePermission(
  permission: string
): Promise<
  { context: AuthContext; error?: never } | { context?: never; error: NextResponse }
> {
  const authResult = await requireAuth();
  if (authResult.error) return authResult;

  if (!hasPermission(authResult.context.role, permission)) {
    return {
      error: NextResponse.json(
        { error: "Forbidden", permission, currentRole: authResult.context.role },
        { status: 403 }
      ),
    };
  }

  return { context: authResult.context };
}

/**
 * Verify the user belongs to the same society as the resource.
 */
export function verifySocietyAccess(
  context: AuthContext,
  resourceSocietyId: string
): boolean {
  return context.societyId === resourceSocietyId;
}

/**
 * For residents, verify they are accessing their own data.
 */
export function verifyResidentAccess(
  context: AuthContext,
  resourceResidentId: string
): boolean {
  if (context.role === "COMMITTEE_MEMBER") {
    return true;
  }
  return context.residentId === resourceResidentId;
}
