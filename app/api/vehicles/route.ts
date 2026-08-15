import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";

const createVehicleSchema = z.object({
  vin: z
    .string()
    .trim()
    .min(5, "VIN is required")
    .max(30, "VIN is too long")
    .transform((value) => value.toUpperCase().replace(/\s+/g, "")),

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

  status: z
    .enum([
      "PURCHASED",
      "IN_PREPARATION",
      "READY_FOR_SALE",
      "RESERVED",
      "SOLD",
      "HOLD",
      "CANCELLED",
    ])
    .optional(),

  location: z.string().trim().optional(),
});

export async function GET() {
  try {
    const vehicles = await db.vehicle.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        photos: {
          orderBy: {
            sortOrder: "asc",
          },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      vehicles,
    });
  } catch (error) {
    console.error("VINIX vehicle fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to fetch vehicles.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = createVehicleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid vehicle data",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = result.data;

    const vehicle = await db.vehicle.create({
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
        status: data.status ?? "PURCHASED",
        location: data.location || null,
      },
    });

    await db.vehicleEvent.create({
      data: {
        vehicleId: vehicle.id,
        eventType: "VEHICLE_CREATED",
        description: `Vehicle ${vehicle.vin} created`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        vehicle,
      },
      { status: 201 }
    );
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

    console.error("VINIX vehicle creation error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create vehicle.",
      },
      { status: 500 }
    );
  }
}