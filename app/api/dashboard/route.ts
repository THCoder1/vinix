import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

export async function GET() {
  const auth = await requirePermission("VIEW_STOCK");

  if (auth.response) {
    return auth.response;
  }

  try {
    const vehicles = await db.vehicle.findMany({
      select: {
        id: true,
        status: true,
        acquisitions: {
          select: {
            purchasePrice: true,
            auctionFee: true,
            transportCost: true,
            taxCost: true,
            otherCost: true,
          },
        },
        expenses: {
          select: {
            amount: true,
            taxAmount: true,
          },
        },
        sales: {
          select: {
            salePrice: true,
          },
        },
      },
    });

    const unsoldVehicles = vehicles.filter(
      (vehicle) => vehicle.status !== "SOLD"
    );

    const stockCount = unsoldVehicles.length;

    const soldCount = vehicles.filter(
  (vehicle) => vehicle.status === "SOLD"
).length;

    const capitalInvested = unsoldVehicles.reduce(
      (total, vehicle) => {
        const acquisition =
          vehicle.acquisitions[0] ?? null;

        const acquisitionCost = acquisition
          ? Number(acquisition.purchasePrice) +
            Number(acquisition.auctionFee) +
            Number(acquisition.transportCost) +
            Number(acquisition.taxCost) +
            Number(acquisition.otherCost)
          : 0;

        const expenses = vehicle.expenses.reduce(
          (sum, expense) =>
            sum +
            Number(expense.amount) +
            Number(expense.taxAmount),
          0
        );

        return total + acquisitionCost + expenses;
      },
      0
    );

    const realizedProfit = vehicles.reduce(
      (total, vehicle) => {
        if (
          vehicle.status !== "SOLD" ||
          vehicle.sales.length === 0
        ) {
          return total;
        }

        const acquisition =
          vehicle.acquisitions[0] ?? null;

        if (!acquisition) {
          return total;
        }

        const acquisitionCost =
          Number(acquisition.purchasePrice) +
          Number(acquisition.auctionFee) +
          Number(acquisition.transportCost) +
          Number(acquisition.taxCost) +
          Number(acquisition.otherCost);

        const expenses = vehicle.expenses.reduce(
          (sum, expense) =>
            sum +
            Number(expense.amount) +
            Number(expense.taxAmount),
          0
        );

        const trueCost =
          acquisitionCost + expenses;

        const salePrice = Number(
          vehicle.sales[0].salePrice
        );

        return total + (salePrice - trueCost);
      },
      0
    );

    return NextResponse.json({
      success: true,
        dashboard: {
        stockCount,
        capitalInvested,
        realizedProfit,
        soldCount,
        },    });
  } catch (error) {
    console.error(
      "VINIX dashboard fetch error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load dashboard.",
      },
      { status: 500 }
    );
  }
}