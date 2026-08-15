import { Decimal } from "@prisma/client/runtime/library";

type Money = Decimal | number | string;

const n = (value: Money | null | undefined) => Number(value ?? 0);

export function acquisitionTotal(acquisition: {
  purchasePrice: Money;
  auctionFee?: Money;
  transportCost?: Money;
  taxCost?: Money;
  otherCost?: Money;
}) {
  return (
    n(acquisition.purchasePrice) +
    n(acquisition.auctionFee) +
    n(acquisition.transportCost) +
    n(acquisition.taxCost) +
    n(acquisition.otherCost)
  );
}

export function totalInvestment(
  acquisition: Parameters<typeof acquisitionTotal>[0],
  expenses: Array<{ amount: Money }>
) {
  return acquisitionTotal(acquisition) + expenses.reduce((sum, e) => sum + n(e.amount), 0);
}

export function grossProfit(totalCost: Money, salePrice: Money) {
  return n(salePrice) - n(totalCost);
}

export function grossMargin(totalCost: Money, salePrice: Money) {
  const sale = n(salePrice);
  return sale === 0 ? 0 : (grossProfit(totalCost, salePrice) / sale) * 100;
}
