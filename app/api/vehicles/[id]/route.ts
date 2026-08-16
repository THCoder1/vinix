import { NextResponse } from "next/server";
import { VehicleStatus } from "@prisma/client";
import { z } from "zod";

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

const updateVehicleSchema = z.object({
  status: z.nativeEnum(VehicleStatus),
});

export async function PATCH(
  request: Request,
  context: RouteContext
) {
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

    if (newStatus === "SOLD") {
  const sale = await db.sale.findUnique({
    where: {
      vehicleId,
    },
    select: {
      id: true,
    },
  });

  if (!sale) {
    return NextResponse.json(
      {
        success: false,
        error: "A sale record is required before marking the vehicle as SOLD.",
      },
      { status: 400 }
    );
  }
}

    if (newStatus === vehicle.status) {
      return NextResponse.json({
        success: true,
        vehicle,
        changed: false,
      });
    }

    const updatedVehicle = await db.$transaction(async (tx) => {
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
          eventType: "STATUS_CHANGED",
          description: `Status changed from ${vehicle.status} to ${newStatus}`,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      changed: true,
      vehicle: updatedVehicle,
    });
  } catch (error) {
    console.error("VINIX vehicle status update error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update vehicle status.",
      },
      { status: 500 }
    );
  }
}