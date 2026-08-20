import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

const expenseSchema = z.object({
  category: z.enum([
    "MECHANICAL",
    "PARTS",
    "TYRES",
    "BODYWORK",
    "PAINT",
    "DETAILING",
    "ITV",
    "GESTORIA",
    "REGISTRATION",
    "TRANSPORT",
    "WARRANTY",
    "OTHER",
  ]),

  description: z
    .string()
    .trim()
    .min(1, "Description is required"),

  supplier: z.string().trim().optional(),

  invoiceNumber: z.string().trim().optional(),

  amount: z.number().nonnegative(),

  taxAmount: z.number().nonnegative().default(0),

  date: z.string().optional(),
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
  const auth = await requirePermission("CREATE_EXPENSE");

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

    const result = expenseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid expense data.",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = result.data;

    const expense = await db.$transaction(
      async (tx) => {
        const createdExpense = await tx.expense.create({
          data: {
            vehicleId,
            category: data.category,
            description: data.description,
            supplier: data.supplier || null,
            invoiceNumber: data.invoiceNumber || null,
            amount: new Prisma.Decimal(data.amount),
            taxAmount: new Prisma.Decimal(data.taxAmount),
            date: data.date
              ? new Date(data.date)
              : new Date(),
          },
        });

        await tx.vehicleEvent.create({
          data: {
            vehicleId,
            eventType: "EXPENSE_ADDED",
            description: `Expense added: ${data.description}`,
            userId: auth.user.id,
          },
        });

        return createdExpense;
      }
    );

    return NextResponse.json(
      {
        success: true,
        expense,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "VINIX expense creation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create expense.",
      },
      { status: 500 }
    );
  }
}