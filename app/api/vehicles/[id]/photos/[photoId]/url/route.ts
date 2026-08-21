import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
    photoId: string;
  }>;
};

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const auth = await requirePermission("VIEW_STOCK");

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id: vehicleId, photoId } = await context.params;

    const photo = await db.vehiclePhoto.findFirst({
      where: {
        id: photoId,
        vehicleId,
      },
      select: {
        id: true,
        storagePath: true,
        isPrimary: true,
      },
    });

    if (!photo) {
      return NextResponse.json(
        {
          success: false,
          error: "Vehicle photo not found.",
        },
        { status: 404 }
      );
    }

    const supabase = await createClient();

    const {
      data: signedUrlData,
      error: signedUrlError,
    } = await supabase.storage
      .from("vehicle-photos")
      .createSignedUrl(
        photo.storagePath,
        SIGNED_URL_TTL_SECONDS
      );

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error(
        "VINIX vehicle photo signed URL error:",
        signedUrlError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to generate photo URL.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      photo: {
        id: photo.id,
        isPrimary: photo.isPrimary,
        url: signedUrlData.signedUrl,
        expiresIn: SIGNED_URL_TTL_SECONDS,
      },
    });
  } catch (error) {
    console.error(
      "VINIX vehicle photo URL error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load vehicle photo.",
      },
      { status: 500 }
    );
  }
}