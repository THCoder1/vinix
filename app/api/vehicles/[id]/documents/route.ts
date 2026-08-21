import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const auth = await requirePermission(
    "VIEW_DOCUMENTS"
  );

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id: vehicleId } = await context.params;

    const vehicle = await db.vehicle.findUnique({
      where: {
        id: vehicleId,
      },
      select: {
        id: true,
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

    const documents = await db.document.findMany({
      where: {
        vehicleId,
      },
      orderBy: {
        uploadedAt: "desc",
      },
      select: {
        id: true,
        type: true,
        filename: true,
        mimeType: true,
        source: true,
        ocrStatus: true,
        ocrError: true,
        ocrProcessedAt: true,
        ocrReviewedAt: true,
        uploadedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error(
      "VINIX vehicle document fetch error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to fetch vehicle documents.",
      },
      { status: 500 }
    );
  }
}