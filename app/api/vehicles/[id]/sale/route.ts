import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { isSaleEligibleVehicleStatus } from "@/lib/vehicle-lifecycle";

const saleSchema = z.object({
  saleDate: z
    .string()
    .trim()
    .refine(
      (value) =>
        !Number.isNaN(new Date(value).getTime()),
      "Sale date must be valid"
    )
    .optional(),

  salePrice: z.number().positive(),

  invoiceNumber: z.string().trim().optional(),

  paymentStatus: z
    .enum([
      "PENDING",
      "PARTIAL",
      "PAID",
      "REFUNDED",
    ])
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
  const auth = await requirePermission("CREATE_SALE");

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
        vin: true,
        status: true,
        acquisitions: {
          select: {
            id: true,
            approvedAt: true,
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

    const existingSale =
      await db.sale.findUnique({
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

    if (
      !isSaleEligibleVehicleStatus(
        vehicle.status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "This vehicle is not eligible for sale.",
        },
        { status: 409 }
      );
    }

    const acquisition =
      vehicle.acquisitions[0];

    if (!acquisition) {
      return NextResponse.json(
        {
          success: false,
          error:
            "An acquisition record is required before selling this vehicle.",
        },
        { status: 409 }
      );
    }

    if (!acquisition.approvedAt) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The acquisition must be approved before selling this vehicle.",
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

    const saleDate = data.saleDate
      ? new Date(data.saleDate)
      : new Date();

    const sale = await db.$transaction(
      async (tx) => {
        const createdSale =
          await tx.sale.create({
            data: {
              vehicleId,
              saleDate,
              salePrice: new Prisma.Decimal(
                data.salePrice
              ),
              invoiceNumber:
                data.invoiceNumber || null,
              paymentStatus:
                data.paymentStatus,
            },
          });

        await tx.vehicle.update({
          where: {
            id: vehicleId,
          },
          data: {
            status: "SOLD",
          },
        });

        await tx.vehicleEvent.create({
          data: {
            vehicleId,
            eventType: "VEHICLE_SOLD",
            description: `Vehicle sold for ${data.salePrice.toFixed(2)}`,
            userId: auth.user.id,
          },
        });

        return createdSale;
      }
    );

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