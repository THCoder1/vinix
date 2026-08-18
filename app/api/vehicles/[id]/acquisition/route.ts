import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";

const acquisitionSchema = z.object({
  supplier: z.string().trim().optional(),
  auctionHouse: z.string().trim().optional(),
  invoiceNumber: z.string().trim().optional(),
  invoiceDate: z.string().optional(),

  purchasePrice: z.number().positive(),
  auctionFee: z.number().nonnegative().default(0),
  transportCost: z.number().nonnegative().default(0),
  taxCost: z.number().nonnegative().default(0),
  otherCost: z.number().nonnegative().default(0),

  currency: z.string().trim().length(3).default("EUR"),
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
      where: { id: vehicleId },
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

    const existingAcquisition = await db.acquisition.findUnique({
      where: { vehicleId },
      select: { id: true },
    });

    if (existingAcquisition) {
      return NextResponse.json(
        {
          success: false,
          error: "This vehicle already has an acquisition record.",
        },
        { status: 409 }
      );
    }

    const body = await request.json();

    const result = acquisitionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid acquisition data.",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = result.data;

    const acquisition = await db.$transaction(
      async (tx) => {
        const createdAcquisition = await tx.acquisition.create({
          data: {
            vehicleId,
            supplier: data.supplier || null,
            auctionHouse: data.auctionHouse || null,
            invoiceNumber: data.invoiceNumber || null,
            invoiceDate: data.invoiceDate
              ? new Date(data.invoiceDate)
              : null,
            purchasePrice: new Prisma.Decimal(
              data.purchasePrice
            ),
            auctionFee: new Prisma.Decimal(
              data.auctionFee
            ),
            transportCost: new Prisma.Decimal(
              data.transportCost
            ),
            taxCost: new Prisma.Decimal(
              data.taxCost
            ),
            otherCost: new Prisma.Decimal(
              data.otherCost
            ),
            currency: data.currency.toUpperCase(),
          },
        });

        await tx.vehicleEvent.create({
          data: {
            vehicleId,
            eventType: "ACQUISITION_CREATED",
            description: `Acquisition recorded for ${vehicle.vin}`,
          },
        });

        return createdAcquisition;
      }
    );

    return NextResponse.json(
      {
        success: true,
        acquisition,
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
          error: "This vehicle already has an acquisition record.",
        },
        { status: 409 }
      );
    }

    console.error(
      "VINIX acquisition creation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create acquisition.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id: vehicleId } = await context.params;

    const acquisition = await db.acquisition.findUnique({
      where: {
        vehicleId,
      },
      include: {
        vehicle: {
          select: {
            vin: true,
          },
        },
      },
    });

    if (!acquisition) {
      return NextResponse.json(
        {
          success: false,
          error: "Acquisition not found.",
        },
        { status: 404 }
      );
    }

    if (acquisition.approvedAt) {
      return NextResponse.json(
        {
          success: false,
          error: "This acquisition is already approved.",
        },
        { status: 409 }
      );
    }

    const approvedAt = new Date();

    const updatedAcquisition = await db.$transaction(
      async (tx) => {
        const updated = await tx.acquisition.update({
          where: {
            id: acquisition.id,
          },
          data: {
            approvedAt,
          },
        });

        await tx.vehicleEvent.create({
          data: {
            vehicleId,
            eventType: "ACQUISITION_APPROVED",
            description: `Acquisition approved for ${acquisition.vehicle.vin}`,
          },
        });

        return updated;
      }
    );

    return NextResponse.json({
      success: true,
      acquisition: updatedAcquisition,
    });
  } catch (error) {
    console.error(
      "VINIX acquisition approval error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to approve acquisition.",
      },
      { status: 500 }
    );
  }
}