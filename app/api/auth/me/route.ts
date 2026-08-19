import { NextResponse } from "next/server";

import { getOrCreateCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("VINIX auth/me error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load current user.",
      },
      { status: 500 }
    );
  }
}
