import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

const editVehicleSchema = z.object({
  vin: z
    .string()
    .trim()
    .min(5, "VIN is required")
    .max(30, "VIN is too long")
    .transform((value) =>
      value.toUpperCase().replace(/\s+/g, "")
    ),

  registration: z.string().trim().optional(),
  make: z.string().trim().min(1, "Make is required"),
  model: z.string().trim().min(1, "Model is required"),
  version: z.string().trim().optional(),

  firstRegistration: z.string().optional(),
  mileage: z.number().int().nonnegative().optional(),

  fuel: z
    .enum([
      "PETROL",
      "DIESEL",
      "HYBRID",
      "PLUG_IN_HYBRID",
      "ELECTRIC",
      "LPG",
      "OTHER",
    ])
    .optional(),

  engine: z.string().trim().optional(),
  transmission: z.string().trim().optional(),
  colour: z.string().trim().optional(),
  location: z.string().trim().optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

    const existingVehicle = await db.vehicle.findUnique({
      where: {
        id: vehicleId,
      },
      select: {
        id: true,
        vin: true,
      },
    });

    if (!existingVehicle) {
      return NextResponse.json(
        {
          success: false,
          error: "Vehicle not found.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = editVehicleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid vehicle data.",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = result.data;

    const updatedVehicle = await db.$transaction(
      async (tx) => {
        const vehicle = await tx.vehicle.update({
          where: {
            id: vehicleId,
          },
          data: {
            vin: data.vin,
            registration: data.registration || null,
            make: data.make,
            model: data.model,
            version: data.version || null,
            firstRegistration: data.firstRegistration
              ? new Date(data.firstRegistration)
              : null,
            mileage: data.mileage ?? null,
            fuel: data.fuel,
            engine: data.engine || null,
            transmission: data.transmission || null,
            colour: data.colour || null,
            location: data.location || null,
          },
        });

        await tx.vehicleEvent.create({
          data: {
            vehicleId,
            eventType: "STATUS_CHANGED",
            description: `Vehicle details updated for ${vehicle.vin}`,
            userId: auth.user.id,
          },
        });

        return vehicle;
      }
    );

    return NextResponse.json({
      success: true,
      vehicle: updatedVehicle,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A vehicle with this VIN already exists.",
        },
        { status: 409 }
      );
    }

    console.error(
      "VINIX vehicle edit error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update vehicle.",
      },
      { status: 500 }
    );
  }
}