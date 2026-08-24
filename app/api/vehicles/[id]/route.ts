import { NextResponse } from "next/server";
import { VehicleStatus } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import {
  getSelectableVehicleStatusTransitions,
  isValidVehicleStatusTransition,
} from "@/lib/vehicle-lifecycle";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const auth = await requirePermission("VIEW_STOCK");

  if (auth.response) {
    return auth.response;
  }

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
      vehicle: {
        ...vehicle,
        allowedStatusTransitions:
          getSelectableVehicleStatusTransitions(
            vehicle.status
          ),
      },
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

const updateVehicleSchema = z.object({
  status: z.nativeEnum(VehicleStatus),
});

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const auth = await requirePermission("UPDATE_VEHICLE");

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
        status: true,
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

    const body = await request.json();
    const result = updateVehicleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid vehicle status.",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const newStatus = result.data.status;

    if (newStatus === vehicle.status) {
      return NextResponse.json({
        success: true,
        vehicle: {
          ...vehicle,
          allowedStatusTransitions:
            getSelectableVehicleStatusTransitions(
              vehicle.status
            ),
        },
        changed: false,
      });
    }

    const sale = await db.sale.findUnique({
      where: {
        vehicleId,
      },
      select: {
        id: true,
      },
    });

    if (sale) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A vehicle with a sale record must remain SOLD.",
        },
        { status: 409 }
      );
    }

    if (newStatus === VehicleStatus.SOLD) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Vehicles can only be marked as SOLD through the sale workflow.",
        },
        { status: 409 }
      );
    }

    if (
      !isValidVehicleStatusTransition(
        vehicle.status,
        newStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid vehicle status transition.",
          details: `Cannot move vehicle from ${vehicle.status} to ${newStatus}.`,
        },
        { status: 409 }
      );
    }

    const updatedVehicle =
      await db.$transaction(async (tx) => {
        const updated = await tx.vehicle.update({
          where: {
            id: vehicleId,
          },
          data: {
            status: newStatus,
          },
        });

        await tx.vehicleEvent.create({
          data: {
            vehicleId,
            eventType:
              newStatus === VehicleStatus.RESERVED
                ? "VEHICLE_RESERVED"
                : "STATUS_CHANGED",
            description:
              newStatus === VehicleStatus.RESERVED
                ? `Vehicle reserved from ${vehicle.status}`
                : `Status changed from ${vehicle.status} to ${newStatus}`,
            userId: auth.user.id,
          },
        });

        return updated;
      });

    return NextResponse.json({
      success: true,
      changed: true,
      vehicle: {
        ...updatedVehicle,
        allowedStatusTransitions:
          getSelectableVehicleStatusTransitions(
            updatedVehicle.status
          ),
      },
    });
  } catch (error) {
    console.error(
      "VINIX vehicle status update error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update vehicle status.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  const auth = await requirePermission("DELETE_VEHICLE");

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
        status: true,
        photos: {
          select: {
            storagePath: true,
          },
        },
        documents: {
          select: {
            storagePath: true,
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

    if (vehicle.status === VehicleStatus.SOLD) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Sold vehicles cannot be deleted.",
        },
        { status: 409 }
      );
    }

    const supabase = await createClient();

    const photoPaths = vehicle.photos.map(
      (photo) => photo.storagePath
    );

    const documentPaths = vehicle.documents.map(
      (document) => document.storagePath
    );

    if (photoPaths.length > 0) {
      const { error: photoCleanupError } =
        await supabase.storage
          .from("vehicle-photos")
          .remove(photoPaths);

      if (photoCleanupError) {
        console.error(
          "VINIX vehicle photo cleanup error:",
          photoCleanupError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to clean up vehicle photos. Vehicle was not deleted.",
          },
          { status: 500 }
        );
      }
    }

    if (documentPaths.length > 0) {
      const { error: documentCleanupError } =
        await supabase.storage
          .from("vehicle-documents")
          .remove(documentPaths);

      if (documentCleanupError) {
        console.error(
          "VINIX vehicle document cleanup error:",
          documentCleanupError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to clean up vehicle documents. Vehicle was not deleted.",
          },
          { status: 500 }
        );
      }
    }

    await db.vehicle.delete({
      where: {
        id: vehicleId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "VINIX vehicle deletion error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to delete vehicle.",
      },
      { status: 500 }
    );
  }
}