import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
    photoId: string;
  }>;
};

const updatePhotoSchema = z.object({
  sortOrder: z
    .number()
    .int()
    .nonnegative()
    .optional(),

  isPrimary: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const auth = await requirePermission("MANAGE_PHOTOS");

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id: vehicleId, photoId } =
      await context.params;

    const photo = await db.vehiclePhoto.findFirst({
      where: {
        id: photoId,
        vehicleId,
      },
      select: {
        id: true,
        vehicleId: true,
        sortOrder: true,
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

    const body = await request.json();

    const result = updatePhotoSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid photo update data.",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = result.data;

    if (
      data.sortOrder === undefined &&
      data.isPrimary === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "No photo changes were provided.",
        },
        { status: 400 }
      );
    }

    const updatedPhoto = await db.$transaction(
      async (tx) => {
        if (data.isPrimary === true) {
          await tx.vehiclePhoto.updateMany({
            where: {
              vehicleId,
              isPrimary: true,
              id: {
                not: photoId,
              },
            },
            data: {
              isPrimary: false,
            },
          });
        }

        if (data.isPrimary === false) {
          const primaryPhoto =
            await tx.vehiclePhoto.findFirst({
              where: {
                vehicleId,
                isPrimary: true,
                id: {
                  not: photoId,
                },
              },
              select: {
                id: true,
              },
            });

          if (!primaryPhoto) {
            return photo;
          }
        }

        return tx.vehiclePhoto.update({
          where: {
            id: photoId,
          },
          data: {
            ...(data.sortOrder !== undefined
              ? {
                  sortOrder: data.sortOrder,
                }
              : {}),
            ...(data.isPrimary !== undefined
              ? {
                  isPrimary: data.isPrimary,
                }
              : {}),
          },
        });
      }
    );

    return NextResponse.json({
      success: true,
      photo: updatedPhoto,
    });
  } catch (error) {
    console.error(
      "VINIX vehicle photo update error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update vehicle photo.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  const auth = await requirePermission("MANAGE_PHOTOS");

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id: vehicleId, photoId } =
      await context.params;

    const photo = await db.vehiclePhoto.findFirst({
      where: {
        id: photoId,
        vehicleId,
      },
      select: {
        id: true,
        vehicleId: true,
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

    const { error: storageError } =
      await supabase.storage
        .from("vehicle-photos")
        .remove([photo.storagePath]);

    if (storageError) {
      console.error(
        "VINIX vehicle photo storage deletion error:",
        storageError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to delete vehicle photo.",
        },
        { status: 500 }
      );
    }

    await db.vehiclePhoto.delete({
      where: {
        id: photoId,
      },
    });

    if (photo.isPrimary) {
      const replacement =
        await db.vehiclePhoto.findFirst({
          where: {
            vehicleId,
          },
          orderBy: {
            sortOrder: "asc",
          },
          select: {
            id: true,
          },
        });

      if (replacement) {
        await db.vehiclePhoto.update({
          where: {
            id: replacement.id,
          },
          data: {
            isPrimary: true,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "VINIX vehicle photo deletion error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to delete vehicle photo.",
      },
      { status: 500 }
    );
  }
}