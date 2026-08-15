import { NextResponse } from "next/server";

import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const vehicle = await db.vehicle.findUnique({
      where: {
        id,
      },
      include: {
        photos: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        acquisitions: {
          orderBy: {
            createdAt: "desc",
          },
        },
        expenses: {
          orderBy: {
            date: "desc",
          },
        },
        documents: {
          orderBy: {
            uploadedAt: "desc",
          },
        },
        sales: {
          orderBy: {
            createdAt: "desc",
          },
        },
        events: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        {
          success: false,
          error: "Vehicle not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      vehicle,
    });
  } catch (error) {
    console.error("VINIX vehicle detail error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to fetch vehicle.",
      },
      { status: 500 }
    );
  }
}