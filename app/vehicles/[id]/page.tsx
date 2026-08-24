"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  acquisitionTotal,
  expenseTotal,
  totalInvestment,
  grossProfit,
  grossMargin,
  returnOnInvestment,
} from "@/lib/calculations";
import VehicleDocuments from "@/components/vehicles/VehicleDocuments";
import { useParams, useRouter } from "next/navigation";

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
  allowedStatusTransitions: string[];
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
  approvedAt: string | null;
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
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [approvingAcquisition, setApprovingAcquisition] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saleForm, setSaleForm] = useState({
    salePrice: "",
    saleDate: "",
    invoiceNumber: "",
    paymentStatus: "PENDING",
  });
  const [savingSale, setSavingSale] = useState(false);
  const [saleError, setSaleError] = useState("");

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
            status: data.vehicle.status,
            allowedStatusTransitions:
              data.vehicle.allowedStatusTransitions,
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

async function approveAcquisition() {
  if (!vehicle || vehicle.acquisitions.length === 0) {
    return;
  }

  setApprovingAcquisition(true);
  setError("");

  try {
    const response = await fetch(
      `/api/vehicles/${vehicle.id}/acquisition`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Unable to approve acquisition."
      );
    }

    setVehicle((current) => {
      if (!current || current.acquisitions.length === 0) {
        return current;
      }

      return {
        ...current,
        acquisitions: [
          {
            ...current.acquisitions[0],
            approvedAt: data.acquisition.approvedAt,
          },
          ...current.acquisitions.slice(1),
        ],
      };
    });
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to approve acquisition."
    );
  } finally {
    setApprovingAcquisition(false);
  }
}

async function submitSale(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!vehicle) {
    return;
  }

  setSavingSale(true);
  setSaleError("");

  try {
    const response = await fetch(
      `/api/vehicles/${vehicle.id}/sale`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          saleDate: saleForm.saleDate || undefined,
          salePrice: Number(saleForm.salePrice),
          invoiceNumber: saleForm.invoiceNumber || undefined,
          paymentStatus: saleForm.paymentStatus,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Unable to record sale."
      );
    }

    setVehicle((current) =>
      current
        ? {
            ...current,
            status: "SOLD",
            sales: [data.sale],
          }
        : current
    );

    setSaleForm({
      salePrice: "",
      saleDate: "",
      invoiceNumber: "",
      paymentStatus: "PENDING",
    });
    setShowSaleForm(false);

    const refreshedResponse = await fetch(
      `/api/vehicles/${vehicle.id}`
    );
    const refreshedData = await refreshedResponse.json();

    if (!refreshedResponse.ok || !refreshedData.success) {
      throw new Error(
        "Sale recorded, but vehicle details could not be refreshed."
      );
    }

    setVehicle(refreshedData.vehicle);
  } catch (err) {
    setSaleError(
      err instanceof Error
        ? err.message
        : "Unable to record sale."
    );
  } finally {
    setSavingSale(false);
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

      const loadedVehicle = data.vehicle;

      if (
        loadedVehicle.photos?.length > 0
      ) {
        const photosWithUrls = await Promise.all(
          loadedVehicle.photos.map(
            async (photo: Vehicle["photos"][number]) => {
              const photoResponse = await fetch(
                `/api/vehicles/${id}/photos/url?photoId=${photo.id}`
              );

              if (!photoResponse.ok) {
                return photo;
              }

              const photoData =
                await photoResponse.json();

              if (
                !photoData.success ||
                !photoData.photo?.url
              ) {
                return photo;
              }

              return {
                ...photo,
                url: photoData.photo.url,
              };
            }
          )
        );

        loadedVehicle.photos = photosWithUrls;
      }

      if (!cancelled) {
        setVehicle(loadedVehicle);
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

const isSaleEligibleStatus =
  vehicle.status === "READY_FOR_SALE" ||
  vehicle.status === "RESERVED";

const canCreateSale =
  isSaleEligibleStatus &&
  Boolean(acquisition?.approvedAt) &&
  vehicle.sales.length === 0;

const salePrice = Number(saleForm.salePrice);
const hasSalePrice =
  Number.isFinite(salePrice) && salePrice > 0;

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
              disabled={
                updatingStatus ||
                vehicle.allowedStatusTransitions.length === 0
              }
              onChange={(event) => updateStatus(event.target.value)}
            >
              <option value={vehicle.status}>
                {statusLabels[vehicle.status] || vehicle.status}
              </option>
              {vehicle.allowedStatusTransitions.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status] || status}
                </option>
              ))}
            </select>
          </div>

          {vehicle.version && (
            <p className="vehicle-page-version">
              {vehicle.version}
            </p>
          )}
        </div>

        <div className="vehicle-header-actions">
  <button
    type="button"
    className="secondary-button"
  >
    Edit vehicle
  </button>

  {vehicle.status !== "SOLD" && (
    <button
      type="button"
      className="danger-button"
      onClick={async () => {
        const confirmed = window.confirm(
          "Delete this vehicle permanently?\n\nThis will also remove its acquisition, expenses, documents, photos, sales records, and activity history.\n\nThis action cannot be undone."
        );

        if (!confirmed) {
          return;
        }

        try {
          const response = await fetch(
            `/api/vehicles/${vehicle.id}`,
            {
              method: "DELETE",
            }
          );

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(
              data.error || "Unable to delete vehicle."
            );
          }

          router.push("/stock");
          router.refresh();
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to delete vehicle."
          );
        }
      }}
    >
      Delete vehicle
    </button>
  )}
</div>
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

    {acquisition && (
      <span
        className={
          acquisition.approvedAt
            ? "status-badge status-ready_for_sale"
            : "status-badge status-purchased"
        }
      >
        {acquisition.approvedAt
          ? "Approved"
          : "Pending approval"}
      </span>
    )}
  </div>

  {vehicle.acquisitions.length === 0 ? (
    <div>
      <p className="muted-text">
        No acquisition recorded.
      </p>

      <div className="form-actions">
        <Link
          href={`/vehicles/${vehicle.id}/acquisition`}
          className="primary-button"
        >
          Add acquisition
        </Link>
      </div>
    </div>
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

            {acquisition.supplier && (
              <span>
                {acquisition.supplier}
              </span>
            )}

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
              <strong>
                {formatMoney(acquisitionCost)}
              </strong>
            </div>
          </div>

          <div className="true-cost">
            <div>
              <span>True vehicle cost</span>
              <small>
                Acquisition + all expenses
              </small>
            </div>

            <strong>
              {formatMoney(trueCost)}
            </strong>
          </div>

          {acquisition.approvedAt ? (
            <div className="acquisition-approved">
              <div>
                <strong>
                  Acquisition approved
                </strong>

                <small>
                  Approved{" "}
                  {formatDateTime(
                    acquisition.approvedAt
                  )}
                </small>
              </div>
            </div>
          ) : (
            <div className="acquisition-approval">
              <div>
                <strong>
                  Acquisition pending approval
                </strong>

                <p>
                  Review the acquisition costs before
                  approving this vehicle.
                </p>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={approveAcquisition}
                disabled={approvingAcquisition}
              >
                {approvingAcquisition
                  ? "Approving..."
                  : "Approve acquisition"}
              </button>
            </div>
          )}
        </>
      );
    })()
  )}
</section>          <section className="workspace-card">
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

<section className="workspace-card preparation-card">
  <div className="section-heading">
    <div>
      <div className="eyebrow">Preparation</div>
      <h2>Vehicle preparation</h2>
    </div>

    <span
      className={`status-badge status-${vehicle.status.toLowerCase()}`}
    >
      {statusLabels[vehicle.status] || vehicle.status}
    </span>
  </div>

  <div className="preparation-grid">
    <div>
      <span>Current stage</span>
      <strong>
        {statusLabels[vehicle.status] || vehicle.status}
      </strong>
    </div>

    <div>
      <span>Recorded costs</span>
      <strong>{formatMoney(totalExpenses)}</strong>
    </div>

    <div>
      <span>Expenses</span>
      <strong>{vehicle.expenses.length}</strong>
    </div>

    <div>
      <span>Last activity</span>
      <strong>
        {vehicle.events.length > 0
          ? formatDateTime(vehicle.events[0].createdAt)
          : "No activity"}
      </strong>
    </div>
  </div>

  {vehicle.status === "IN_PREPARATION" && (
    <div className="preparation-action">
      <div>
        <strong>Preparation in progress</strong>
        <p>
          Record the work and costs below, then mark the vehicle
          ready when preparation is complete.
        </p>
      </div>

      <button
        type="button"
        className="primary-button"
        onClick={() => updateStatus("READY_FOR_SALE")}
        disabled={updatingStatus}
      >
        {updatingStatus
          ? "Updating..."
          : "Mark ready for sale"}
      </button>
    </div>
  )}

  {vehicle.status === "READY_FOR_SALE" && (
    <div className="preparation-action">
      <div>
        <strong>Vehicle ready for sale</strong>
        <p>
          If additional preparation is required, return the
          vehicle to preparation.
        </p>
      </div>

      <button
        type="button"
        className="secondary-button"
        onClick={() => updateStatus("IN_PREPARATION")}
        disabled={updatingStatus}
      >
        {updatingStatus
          ? "Updating..."
          : "Return to preparation"}
      </button>
    </div>
  )}
</section>

<section className="workspace-card">
  <div className="section-heading">
    <div>
      <div className="eyebrow">Sale</div>
      <h2>Sale information</h2>
    </div>

    {canCreateSale && (
      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          setShowSaleForm((current) => !current);
          setSaleError("");
        }}
        disabled={savingSale}
      >
        {showSaleForm ? "Cancel" : "Record sale"}
      </button>
    )}
  </div>

  {saleError && (
    <p className="muted-text" role="alert">
      {saleError}
    </p>
  )}

  {vehicle.sales.length > 0 ? (
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
  ) : !isSaleEligibleStatus ? (
    <p className="muted-text">
      Vehicle must be ready for sale or reserved before it can be sold.
    </p>
  ) : !acquisition ? (
    <p className="muted-text">
      An acquisition record is required before this vehicle can be sold.
    </p>
  ) : !acquisition.approvedAt ? (
    <p className="muted-text">
      Acquisition approval is required before this vehicle can be sold.
    </p>
  ) : showSaleForm ? (
    <form onSubmit={submitSale}>
      <div className="form-grid">
        <label className="form-field form-field-wide">
          <span>Sale price *</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={saleForm.salePrice}
            onChange={(event) =>
              setSaleForm((current) => ({
                ...current,
                salePrice: event.target.value,
              }))
            }
            required
          />
        </label>

        <label className="form-field form-field-wide">
          <span>Sale date</span>
          <input
            type="date"
            value={saleForm.saleDate}
            onChange={(event) =>
              setSaleForm((current) => ({
                ...current,
                saleDate: event.target.value,
              }))
            }
          />
        </label>

        <label className="form-field form-field-wide">
          <span>Invoice number</span>
          <input
            type="text"
            value={saleForm.invoiceNumber}
            onChange={(event) =>
              setSaleForm((current) => ({
                ...current,
                invoiceNumber: event.target.value,
              }))
            }
          />
        </label>

        <label className="form-field form-field-wide">
          <span>Payment status</span>
          <select
            value={saleForm.paymentStatus}
            onChange={(event) =>
              setSaleForm((current) => ({
                ...current,
                paymentStatus: event.target.value,
              }))
            }
          >
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </label>
      </div>

      {hasSalePrice && (
        <>
          <div className="eyebrow">Profitability preview</div>
          <div className="sale-summary">
            <div>
              <span>True vehicle cost</span>
              <strong>{formatMoney(trueCost)}</strong>
            </div>

            <div>
              <span>Gross profit</span>
              <strong>
                {formatMoney(
                  grossProfit(trueCost, salePrice)
                )}
              </strong>
            </div>

            <div>
              <span>Gross margin</span>
              <strong>
                {grossMargin(trueCost, salePrice).toFixed(1)}%
              </strong>
            </div>

            <div>
              <span>ROI</span>
              <strong>
                {returnOnInvestment(
                  trueCost,
                  salePrice
                ).toFixed(1)}%
              </strong>
            </div>
          </div>
        </>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setShowSaleForm(false)}
          disabled={savingSale}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="primary-button"
          disabled={savingSale}
        >
          {savingSale ? "Saving..." : "Save sale"}
        </button>
      </div>
    </form>
  ) : (
    <p className="muted-text">
      Record the completed sale when the transaction is ready.
    </p>
  )}
</section>

          <VehicleDocuments vehicleId={vehicle.id} />
        </aside>
      </section>
    </main>
  );
}
