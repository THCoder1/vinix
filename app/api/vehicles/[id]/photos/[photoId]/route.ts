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

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  const auth = await requirePermission("DELETE_STOCK_PHOTO");

  if (auth.response) {
    return auth.response;
  }

  try {
    const {
      id: vehicleId,
      photoId,
    } = await context.params;

    const photo = await db.vehiclePhoto.findFirst({
      where: {
        id: photoId,
        vehicleId,
      },
      select: {
        id: true,
        storagePath: true,
      },
    });

    if (!photo) {
      return NextResponse.json(
        {
          success: false,
          error: "Vehicle stock photo not found.",
        },
        { status: 404 }
      );
    }

    const supabase = await createClient();

    const { error: storageError } =
      await supabase.storage
        .from("vehicle-photos")
        .remove([photo.storagePath]);

    if (storageError) {
      console.error(
        "VINIX vehicle stock photo storage deletion error:",
        storageError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to delete vehicle stock photo.",
        },
        { status: 500 }
      );
    }

    await db.vehiclePhoto.delete({
      where: {
        id: photoId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "VINIX vehicle stock photo deletion error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to delete vehicle stock photo.",
      },
      { status: 500 }
    );
  }
}