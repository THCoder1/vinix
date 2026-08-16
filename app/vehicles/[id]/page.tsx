"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  acquisitionTotal,
  expenseTotal,
  totalInvestment,
  grossProfit,
  grossMargin,
  returnOnInvestment,
} from "@/lib/calculations";

type Vehicle = {
  id: string;
  vin: string;
  registration: string | null;
  make: string;
  model: string;
  version: string | null;
  firstRegistration: string | null;
  mileage: number | null;
  fuel: string | null;
  engine: string | null;
  transmission: string | null;
  colour: string | null;
  status: string;
  location: string | null;
  photos: {
    id: string;
    url: string | null;
    storagePath: string;
    isPrimary: boolean;
  }[];
  acquisitions: {
  id: string;
  supplier: string | null;
  auctionHouse: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  purchasePrice: string;
  auctionFee: string;
  transportCost: string;
  taxCost: string;
  otherCost: string;
  currency: string;
}[];
expenses: {
  id: string;
  category: string;
  description: string;
  supplier: string | null;
  invoiceNumber: string | null;
  amount: string;
  taxAmount: string;
  date: string;
}[];
sales: {
  id: string;
  saleDate: string | null;
  salePrice: string;
  invoiceNumber: string | null;
  paymentStatus: string;
}[];
  events: {
    id: string;
    eventType: string;
    description: string | null;
    createdAt: string;
  }[];
};

const statusLabels: Record<string, string> = {
  PURCHASED: "Purchased",
  IN_PREPARATION: "In preparation",
  READY_FOR_SALE: "Ready for sale",
  RESERVED: "Reserved",
  SOLD: "Sold",
  HOLD: "On hold",
  CANCELLED: "Cancelled",
};

const fuelLabels: Record<string, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  HYBRID: "Hybrid",
  PLUG_IN_HYBRID: "Plug-in hybrid",
  ELECTRIC: "Electric",
  LPG: "LPG",
  OTHER: "Other",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function VehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    category: "MECHANICAL",
    description: "",
    supplier: "",
    invoiceNumber: "",
    amount: "",
    taxAmount: "",
    date: "",
});

const [savingExpense, setSavingExpense] = useState(false);

  async function updateStatus(newStatus: string) {
  if (!vehicle || newStatus === vehicle.status) {
    return;
  }

  setUpdatingStatus(true);
  setError("");

  try {
    const response = await fetch(`/api/vehicles/${vehicle.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: newStatus,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Unable to update vehicle status."
      );
    }

    setVehicle((current) =>
      current
        ? {
            ...current,
            status: newStatus,
          }
        : current
    );
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to update vehicle status."
    );
  } finally {
    setUpdatingStatus(false);
  }
}

useEffect(() => {
  let cancelled = false;

  async function loadVehicle() {
    try {
      const { id } = await params;

      const response = await fetch(`/api/vehicles/${id}`);

      if (!response.ok) {
        throw new Error("Vehicle not found.");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Unable to load vehicle."
        );
      }

      if (!cancelled) {
        setVehicle(data.vehicle);
      }
    } catch (err) {
      if (!cancelled) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load vehicle."
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  loadVehicle();

  return () => {
    cancelled = true;
  };
}, [params]);


  if (loading) {
    return (
      <main className="main">
        <div className="empty-state">Loading vehicle...</div>
      </main>
    );
  }

  if (error || !vehicle) {
    return (
      <main className="main">
        <Link href="/stock" className="back-link">
          ← Back to stock
        </Link>

        <div className="error-state">
          {error || "Vehicle not found."}
        </div>
      </main>
    );
  }

const acquisition = vehicle.acquisitions[0] ?? null;
const acquisitionCost = acquisition
  ? acquisitionTotal(acquisition)
  : 0;

const trueCost = acquisition
  ? totalInvestment(acquisition, vehicle.expenses)
  : 0;

const totalExpenses = expenseTotal(vehicle.expenses);

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: acquisition?.currency || "EUR",
  }).format(value);

  const primaryPhoto =
    vehicle.photos.find((photo) => photo.isPrimary) ||
    vehicle.photos[0];

  return (
    <main className="main">
      <Link href="/stock" className="back-link">
        ← Back to stock
      </Link>

      <section className="vehicle-page-header">
        <div>
          <div className="eyebrow">VINIX / Vehicle</div>

          <div className="vehicle-title-row">
            <h1>
              {vehicle.make} {vehicle.model}
            </h1>

            <select
              className={`status-badge status-${vehicle.status.toLowerCase()}`}
              value={vehicle.status}
              disabled={updatingStatus}
              onChange={(event) => updateStatus(event.target.value)}
            >
              <option value="PURCHASED">Purchased</option>
              <option value="IN_PREPARATION">In preparation</option>
              <option value="READY_FOR_SALE">Ready for sale</option>
              <option value="RESERVED">Reserved</option>
              <option value="SOLD">Sold</option>
              <option value="HOLD">On hold</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {vehicle.version && (
            <p className="vehicle-page-version">
              {vehicle.version}
            </p>
          )}
        </div>

        <button className="secondary-button">
          Edit vehicle
        </button>
      </section>

      <section className="vehicle-workspace">
        <div className="vehicle-main-column">
          <div className="vehicle-hero-photo">
            {primaryPhoto?.url ? (
              <img
                src={primaryPhoto.url}
                alt={`${vehicle.make} ${vehicle.model}`}
              />
            ) : (
              <div className="large-photo-placeholder">
                <span>PHOTO</span>
                <small>Add vehicle photos</small>
              </div>
            )}
          </div>

          <section className="workspace-card">
            <div className="section-heading">
              <div>
                <div className="eyebrow">Vehicle data</div>
                <h2>Specifications</h2>
              </div>
            </div>

            <div className="spec-grid">
              <div className="spec">
                <span>VIN</span>
                <strong>{vehicle.vin}</strong>
              </div>

              <div className="spec">
                <span>Registration</span>
                <strong>{vehicle.registration || "—"}</strong>
              </div>

              <div className="spec">
                <span>First registration</span>
                <strong>
                  {vehicle.firstRegistration
                    ? formatDate(vehicle.firstRegistration)
                    : "—"}
                </strong>
              </div>

              <div className="spec">
                <span>Mileage</span>
                <strong>
                  {vehicle.mileage
                    ? `${vehicle.mileage.toLocaleString("es-ES")} km`
                    : "—"}
                </strong>
              </div>

              <div className="spec">
                <span>Fuel</span>
                <strong>
                  {vehicle.fuel
                    ? fuelLabels[vehicle.fuel] || vehicle.fuel
                    : "—"}
                </strong>
              </div>

              <div className="spec">
                <span>Engine</span>
                <strong>{vehicle.engine || "—"}</strong>
              </div>

              <div className="spec">
                <span>Transmission</span>
                <strong>{vehicle.transmission || "—"}</strong>
              </div>

              <div className="spec">
                <span>Colour</span>
                <strong>{vehicle.colour || "—"}</strong>
              </div>
            </div>
          </section>

          <section className="workspace-card financial-summary">
  <div className="section-heading">
    <div>
      <div className="eyebrow">Financial overview</div>
      <h2>Vehicle profitability</h2>
    </div>
  </div>

  <div className="financial-summary-grid">
    <div>
      <span>Acquisition</span>
      <strong>{formatMoney(acquisitionCost)}</strong>
    </div>

    <div>
      <span>Expenses</span>
      <strong>{formatMoney(totalExpenses)}</strong>
    </div>

    <div>
      <span>True cost</span>
      <strong>{formatMoney(trueCost)}</strong>
    </div>

    <div>
      <span>Sale price</span>
      <strong>
        {vehicle.sales.length > 0
          ? formatMoney(Number(vehicle.sales[0].salePrice))
          : "—"}
      </strong>
    </div>

    <div className="financial-profit">
      <span>Gross profit</span>
      <strong>
        {vehicle.sales.length > 0
          ? formatMoney(
              Number(vehicle.sales[0].salePrice) - trueCost
            )
          : "—"}
      </strong>
    </div>
  </div>
</section>

          <section className="workspace-card">
  <div className="section-heading">
    <div>
      <div className="eyebrow">Acquisition</div>
      <h2>Purchase cost</h2>
    </div>
  </div>

  {vehicle.acquisitions.length === 0 ? (
    <p className="muted-text">
      No acquisition recorded.
    </p>
  ) : (
    (() => {

      const total =
        Number(acquisition.purchasePrice) +
        Number(acquisition.auctionFee) +
        Number(acquisition.transportCost) +
        Number(acquisition.taxCost) +
        Number(acquisition.otherCost);

      const totalExpenses = vehicle.expenses.reduce(
        (sum, expense) =>
          sum +
          Number(expense.amount) +
          Number(expense.taxAmount),
        0
      );

      const trueCost = total + totalExpenses;

      const formatMoney = (value: number) =>
        new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: acquisition.currency || "EUR",
        }).format(value);

      return (
        <>
          <div className="acquisition-meta">
            <strong>
              {acquisition.auctionHouse || "Supplier"}
            </strong>

            {acquisition.invoiceNumber && (
              <span>
                Invoice {acquisition.invoiceNumber}
              </span>
            )}

            {acquisition.invoiceDate && (
              <span>
                {formatDate(acquisition.invoiceDate)}
              </span>
            )}
          </div>

          <div className="cost-list">
            <div className="cost-row">
              <span>Purchase price</span>
              <strong>
                {formatMoney(
                  Number(acquisition.purchasePrice)
                )}
              </strong>
            </div>

            <div className="cost-row">
              <span>Auction fee</span>
              <strong>
                {formatMoney(
                  Number(acquisition.auctionFee)
                )}
              </strong>
            </div>

            <div className="cost-row">
              <span>Transport</span>
              <strong>
                {formatMoney(
                  Number(acquisition.transportCost)
                )}
              </strong>
            </div>

            <div className="cost-row">
              <span>Tax</span>
              <strong>
                {formatMoney(
                  Number(acquisition.taxCost)
                )}
              </strong>
            </div>

            <div className="cost-row">
              <span>Other</span>
              <strong>
                {formatMoney(
                  Number(acquisition.otherCost)
                )}
              </strong>
            </div>

            <div className="cost-row cost-total">
              <span>Total acquisition</span>
              <strong>{formatMoney(acquisitionCost)}</strong>
            </div>
          </div>
          <div className="true-cost">
              <div>
                <span>True vehicle cost</span>
                <small>Acquisition + all expenses</small>
              </div>

              <strong>{formatMoney(trueCost)}</strong>
            </div>
        </>
      );
    })()
  )}
  
</section>

          <section className="workspace-card">
            <div className="section-heading">
              <div>
                <div className="eyebrow">Vehicle history</div>
                <h2>Activity</h2>
              </div>
            </div>

            {vehicle.events.length === 0 ? (
              <p className="muted-text">
                No activity recorded.
              </p>
            ) : (
              <div className="timeline">
                {vehicle.events.map((event) => (
                  <div className="timeline-item" key={event.id}>
                    <div className="timeline-dot" />

                    <div>
                      <strong>
                        {event.eventType.replaceAll("_", " ")}
                      </strong>

                      {event.description && (
                        <p>{event.description}</p>
                      )}

                      <time>
                        {formatDateTime(event.createdAt)}
                      </time>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="vehicle-side-column">
          <section className="workspace-card">
            <div className="eyebrow">Stock</div>

            <div className="side-stat">
              <span>Status</span>
              <strong>
                {statusLabels[vehicle.status] || vehicle.status}
              </strong>
            </div>

            <div className="side-stat">
              <span>Location</span>
              <strong>
                {vehicle.location || "Not assigned"}
              </strong>
            </div>
          </section>

          <section className="workspace-card future-card">
            <div className="eyebrow">Coming next</div>
            <h3>Financial overview</h3>
            <p>
              Acquisition cost, expenses, total investment,
              sale price and profit will appear here.
            </p>
          </section>

          <section className="workspace-card">
            <div className="section-heading">
            <div>
              <div className="eyebrow">Expenses</div>
              <h2>Additional costs</h2>
            </div>

  <button
    type="button"
    className="secondary-button"
    onClick={() => setShowExpenseForm((current) => !current)}
  >
    {showExpenseForm ? "Cancel" : "+ Add expense"}
  </button>
</div>

{showExpenseForm && (
  <form
    className="expense-form"
    onSubmit={async (event) => {
      event.preventDefault();

      if (!vehicle) {
        return;
      }

      setSavingExpense(true);
      setError("");

      try {
        const response = await fetch(
          `/api/vehicles/${vehicle.id}/expenses`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              category: expenseForm.category,
              description: expenseForm.description,
              supplier: expenseForm.supplier || undefined,
              invoiceNumber:
                expenseForm.invoiceNumber || undefined,
              amount: Number(expenseForm.amount),
              taxAmount: Number(expenseForm.taxAmount || 0),
              date: expenseForm.date || undefined,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Unable to create expense."
          );
        }

        setVehicle((current) =>
          current
            ? {
                ...current,
                expenses: [data.expense, ...current.expenses],
              }
            : current
        );

        setExpenseForm({
          category: "MECHANICAL",
          description: "",
          supplier: "",
          invoiceNumber: "",
          amount: "",
          taxAmount: "",
          date: "",
        });

        setShowExpenseForm(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to create expense."
        );
      } finally {
        setSavingExpense(false);
      }
    }}
  >
    <div className="expense-form-grid">
      <label>
        Category
        <select
          value={expenseForm.category}
          onChange={(event) =>
            setExpenseForm((current) => ({
              ...current,
              category: event.target.value,
            }))
          }
        >
          <option value="MECHANICAL">Mechanical</option>
          <option value="PARTS">Parts</option>
          <option value="TYRES">Tyres</option>
          <option value="BODYWORK">Bodywork</option>
          <option value="PAINT">Paint</option>
          <option value="DETAILING">Detailing</option>
          <option value="ITV">ITV</option>
          <option value="GESTORIA">Gestoria</option>
          <option value="REGISTRATION">Registration</option>
          <option value="TRANSPORT">Transport</option>
          <option value="WARRANTY">Warranty</option>
          <option value="OTHER">Other</option>
        </select>
      </label>

      <label>
        Description
        <input
          type="text"
          value={expenseForm.description}
          onChange={(event) =>
            setExpenseForm((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          required
        />
      </label>

      <label>
        Supplier
        <input
          type="text"
          value={expenseForm.supplier}
          onChange={(event) =>
            setExpenseForm((current) => ({
              ...current,
              supplier: event.target.value,
            }))
          }
        />
      </label>

      <label>
        Invoice number
        <input
          type="text"
          value={expenseForm.invoiceNumber}
          onChange={(event) =>
            setExpenseForm((current) => ({
              ...current,
              invoiceNumber: event.target.value,
            }))
          }
        />
      </label>

      <label>
        Amount
        <input
          type="number"
          min="0"
          step="0.01"
          value={expenseForm.amount}
          onChange={(event) =>
            setExpenseForm((current) => ({
              ...current,
              amount: event.target.value,
            }))
          }
          required
        />
      </label>

      <label>
        VAT / Tax
        <input
          type="number"
          min="0"
          step="0.01"
          value={expenseForm.taxAmount}
          onChange={(event) =>
            setExpenseForm((current) => ({
              ...current,
              taxAmount: event.target.value,
            }))
          }
        />
      </label>

      <label>
        Date
        <input
          type="date"
          value={expenseForm.date}
          onChange={(event) =>
            setExpenseForm((current) => ({
              ...current,
              date: event.target.value,
            }))
          }
        />
      </label>
    </div>

    <div className="expense-form-actions">
      <button
        type="submit"
        className="primary-button"
        disabled={savingExpense}
      >
        {savingExpense ? "Saving..." : "Save expense"}
      </button>
    </div>
  </form>
)}

  {vehicle.expenses.length === 0 ? (
    <p className="muted-text">
      No expenses recorded.
    </p>
  ) : (
    <>
      <div className="expense-list">
        {vehicle.expenses.map((expense) => {
          const total =
            Number(expense.amount) +
            Number(expense.taxAmount);

          return (
            <div
              key={expense.id}
              className="expense-item"
            >
              <div className="expense-main">
                <div className="expense-title">
                  {expense.description}
                </div>

                <div className="expense-meta">
                  <span>{expense.category}</span>

                  {expense.supplier && (
                    <span>{expense.supplier}</span>
                  )}

                  {expense.invoiceNumber && (
                    <span>
                      Invoice {expense.invoiceNumber}
                    </span>
                  )}

                  <span>
                    {formatDate(expense.date)}
                  </span>
                </div>
              </div>

              <div className="expense-amount">
                {new Intl.NumberFormat("es-ES", {
                  style: "currency",
                  currency: "EUR",
                }).format(total)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="expense-total">
        <span>Total expenses</span>

        <strong>
          {new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
          }).format(
            vehicle.expenses.reduce(
              (total, expense) =>
                total +
                Number(expense.amount) +
                Number(expense.taxAmount),
              0
            )
          )}
        </strong>
      </div>
    </>
  )}
</section>

<section className="workspace-card">
  <div className="section-heading">
    <div>
      <div className="eyebrow">Sale</div>
      <h2>Sale information</h2>
    </div>
  </div>

  {vehicle.sales.length === 0 ? (
    <p className="muted-text">
      Vehicle has not been sold.
    </p>
  ) : (
    (() => {
      const sale = vehicle.sales[0];

const profit = grossProfit(
  trueCost,
  sale.salePrice
);

const margin = grossMargin(
  trueCost,
  sale.salePrice
);

const roi = returnOnInvestment(
  trueCost,
  sale.salePrice
);

      return (
        <>
          <div className="sale-summary">
            <div>
              <span>Sale price</span>
              <strong>
                {formatMoney(Number(sale.salePrice))}
              </strong>
            </div>

            <div>
              <span>Gross profit</span>
              <strong>
                {formatMoney(profit)}
              </strong>
            </div>

            <div>
              <span>Gross margin</span>
              <strong>
                {margin.toFixed(1)}%
              </strong>
            </div>

            <div>
              <span>ROI</span>
              <strong>
                {roi.toFixed(1)}%
              </strong>
            </div>
          </div>

          <div className="sale-meta">
            {sale.saleDate && (
              <span>
                Sold {formatDate(sale.saleDate)}
              </span>
            )}

            {sale.invoiceNumber && (
              <span>
                Invoice {sale.invoiceNumber}
              </span>
            )}

            <span>
              Payment: {sale.paymentStatus}
            </span>
          </div>
        </>
      );
    })()
  )}
</section>

          <section className="workspace-card future-card">
            <div className="eyebrow">Coming next</div>
            <h3>Documents</h3>
            <p>
              Auction invoices, transport documents,
              workshop invoices and other vehicle documents.
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}