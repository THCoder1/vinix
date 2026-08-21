import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
    documentId: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext
) {
  const auth = await requirePermission("UPLOAD_DOCUMENT");

  if (auth.response) {
    return auth.response;
  }

  try {
    const {
      id: vehicleId,
      documentId,
    } = await context.params;

    const document = await db.document.findFirst({
      where: {
        id: documentId,
        vehicleId,
      },
      select: {
        id: true,
        ocrStatus: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          error: "Vehicle document not found.",
        },
        { status: 404 }
      );
    }

    if (document.ocrStatus === "PROCESSING") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Document OCR is already processing.",
        },
        { status: 409 }
      );
    }

    if (
      document.ocrStatus === "COMPLETED" ||
      document.ocrStatus === "REVIEW_REQUIRED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Document OCR has already been processed.",
        },
        { status: 409 }
      );
    }

    const updatedDocument =
      await db.document.update({
        where: {
          id: documentId,
        },
        data: {
          ocrStatus: "PROCESSING",
          ocrError: null,
          ocrProcessedAt: null,
        },
        select: {
          id: true,
          ocrStatus: true,
        },
      });

    return NextResponse.json({
      success: true,
      document: updatedDocument,
    });
  } catch (error) {
    console.error(
      "VINIX document OCR start error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to start document OCR processing.",
      },
      { status: 500 }
    );
  }
}