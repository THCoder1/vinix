import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function getExtension(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  const auth = await requirePermission("UPLOAD_PHOTO");

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

    const existingPhoto = await db.vehiclePhoto.findFirst({
      where: {
        vehicleId,
      },
      select: {
        id: true,
      },
    });

    if (existingPhoto) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A stock photo already exists for this vehicle. An ADMIN must delete it before a new photo can be uploaded.",
        },
        { status: 409 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "No image file was provided.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unsupported image type. Use JPEG, PNG, or WebP.",
        },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "The uploaded image is empty.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Image is too large. Maximum size is 10 MB.",
        },
        { status: 400 }
      );
    }

    const extension = getExtension(file.type);
    const fileId = crypto.randomUUID();

    const storagePath =
      `${vehicleId}/original/${fileId}.${extension}`;

    const supabase = await createClient();

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } =
      await supabase.storage
        .from("vehicle-photos")
        .upload(storagePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

    if (uploadError) {
      console.error(
        "VINIX vehicle photo upload error:",
        {
          message: uploadError.message,
          name: uploadError.name,
          statusCode: uploadError.statusCode,
          error: uploadError,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            uploadError.message ||
            "Unable to upload vehicle photo.",
        },
        { status: 500 }
      );
    }

    try {
      const photo = await db.$transaction(
        async (tx) => {
          const photoCount =
            await tx.vehiclePhoto.count({
              where: {
                vehicleId,
              },
            });

          if (photoCount > 0) {
            throw new Error(
              "STOCK_PHOTO_ALREADY_EXISTS"
            );
          }

          return tx.vehiclePhoto.create({
            data: {
              vehicleId,
              storagePath,
              url: null,
              sortOrder: 0,
              isPrimary: true,
            },
          });
        }
      );

      return NextResponse.json(
        {
          success: true,
          photo,
        },
        { status: 201 }
      );
    } catch (databaseError) {
      const { error: cleanupError } =
        await supabase.storage
          .from("vehicle-photos")
          .remove([storagePath]);

      if (cleanupError) {
        console.error(
          "VINIX vehicle photo storage cleanup error:",
          cleanupError
        );
      }

      if (
        databaseError instanceof Error &&
        databaseError.message ===
          "STOCK_PHOTO_ALREADY_EXISTS"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A stock photo already exists for this vehicle. An ADMIN must delete it before a new photo can be uploaded.",
          },
          { status: 409 }
        );
      }

      throw databaseError;
    }
  } catch (error) {
    console.error(
      "VINIX vehicle photo creation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create vehicle photo.",
      },
      { status: 500 }
    );
  }
}