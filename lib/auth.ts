import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import {
  hasPermission,
  type Permission,
} from "@/lib/authorization";

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    return null;
  }

  return db.user.findUnique({
    where: {
      authUserId: authUser.id,
    },
  });
}

export async function getOrCreateCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    return null;
  }

  const email = authUser.email?.trim().toLowerCase();

  if (!email) {
    throw new Error(
      "Authenticated Supabase user does not have an email address."
    );
  }

  const existingUser = await db.user.findUnique({
    where: {
      authUserId: authUser.id,
    },
  });

  if (existingUser) {
    return existingUser;
  }

  return db.user.create({
    data: {
      authUserId: authUser.id,
      email,
      name:
        typeof authUser.user_metadata?.name === "string"
          ? authUser.user_metadata.name.trim() || null
          : null,
      role: UserRole.VIEWER,
    },
  });
}

export async function requirePermission(
  permission: Permission
) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 }
      ),
    };
  }

  if (!hasPermission(user.role, permission)) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to perform this action.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}