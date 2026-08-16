import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";

const saleSchema = z.object({
  saleDate: z.string().optional(),
  salePrice: z.number().nonnegative(),
  invoiceNumber: z.string().trim().optional(),
  paymentStatus: z
    .enum(["PENDING", "PARTIAL", "PAID", "REFUNDED"])
    .default("PENDING"),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
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
        vin: true,
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

    const existingSale = await db.sale.findUnique({
      where: {
        vehicleId,
      },
      select: {
        id: true,
      },
    });

    if (existingSale) {
      return NextResponse.json(
        {
          success: false,
          error: "This vehicle already has a sale record.",
        },
        { status: 409 }
      );
    }

    const body = await request.json();

    const result = saleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid sale data.",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = result.data;

    const sale = await db.sale.create({
      data: {
        vehicleId,
        saleDate: data.saleDate
          ? new Date(data.saleDate)
          : null,
        salePrice: new Prisma.Decimal(data.salePrice),
        invoiceNumber: data.invoiceNumber || null,
        paymentStatus: data.paymentStatus,
      },
    });

    await db.vehicle.update({
  where: {
    id: vehicleId,
  },
  data: {
    status: "SOLD",
  },
});

    await db.vehicleEvent.create({
      data: {
        vehicleId,
        eventType: "VEHICLE_SOLD",
        description: `Vehicle sold for ${data.salePrice.toFixed(2)}`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        sale,
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
          error: "This vehicle already has a sale record.",
        },
        { status: 409 }
      );
    }

    console.error(
      "VINIX sale creation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create sale.",
      },
      { status: 500 }
    );
  }
}