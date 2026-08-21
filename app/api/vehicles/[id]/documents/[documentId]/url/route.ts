import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
    documentId: string;
  }>;
};

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const auth = await requirePermission("VIEW_DOCUMENTS");

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
        filename: true,
        mimeType: true,
        storagePath: true,
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

    const supabase = await createClient();

    const {
      data: signedUrlData,
      error: signedUrlError,
    } = await supabase.storage
      .from("vehicle-documents")
      .createSignedUrl(
        document.storagePath,
        SIGNED_URL_TTL_SECONDS
      );

    if (
      signedUrlError ||
      !signedUrlData?.signedUrl
    ) {
      console.error(
        "VINIX vehicle document signed URL error:",
        signedUrlError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to generate document URL.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        mimeType: document.mimeType,
        url: signedUrlData.signedUrl,
        expiresIn: SIGNED_URL_TTL_SECONDS,
      },
    });
  } catch (error) {
    console.error(
      "VINIX vehicle document URL error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load vehicle document.",
      },
      { status: 500 }
    );
  }
}