"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  acquisitionTotal,
  expenseTotal,
  totalInvestment,
  grossProfit,
  grossMargin,
  returnOnInvestment,
} from "@/lib/calculations";

type VehiclePhoto = {
  id: string;
  url: string | null;
  storagePath: string;
  sortOrder: number;
  isPrimary: boolean;
};

type Vehicle = {
  id: string;
  vin: string;
  registration: string | null;
  make: string;
  model: string;
  version: string | null;
  mileage: number | null;
  status: string;
  location: string | null;
  photos: VehiclePhoto[];
  acquisitions: {
  purchasePrice: string;
  auctionFee: string;
  transportCost: string;
  taxCost: string;
  otherCost: string;
}[];

expenses: {
  amount: string;
  taxAmount: string;
}[];

sales: {
  salePrice: string;
  saleDate: string | null;
  paymentStatus: string;
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

export default function StockPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadVehicles() {
      try {
        const response = await fetch("/api/vehicles");

        if (!response.ok) {
          throw new Error("Unable to load vehicles");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Unable to load vehicles");
        }

        setVehicles(data.vehicles);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load vehicles."
        );
      } finally {
        setLoading(false);
      }
    }

    loadVehicles();
  }, []);

    const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const matchesSearch =
        !query ||
        vehicle.make.toLowerCase().includes(query) ||
        vehicle.model.toLowerCase().includes(query) ||
        vehicle.vin.toLowerCase().includes(query) ||
        vehicle.registration?.toLowerCase().includes(query);

      const matchesStatus =
        status === "ALL" || vehicle.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, search, status]);

  const stockKpis = useMemo(() => {
  const unsoldVehicles = vehicles.filter(
    (vehicle) => vehicle.status !== "SOLD"
  );

  const soldVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "SOLD"
  );

  const stockInvestment = unsoldVehicles.reduce(
    (sum, vehicle) => {
      const acquisition = vehicle.acquisitions[0] ?? null;

      return (
        sum +
        (acquisition
          ? totalInvestment(
              acquisition,
              vehicle.expenses
            )
          : expenseTotal(vehicle.expenses))
      );
    },
    0
  );

  const realizedProfit = soldVehicles.reduce(
    (sum, vehicle) => {
      const acquisition = vehicle.acquisitions[0] ?? null;
      const sale = vehicle.sales[0] ?? null;

      if (!acquisition || !sale) {
        return sum;
      }

      const trueCost = totalInvestment(
        acquisition,
        vehicle.expenses
      );

      return sum + grossProfit(
        trueCost,
        sale.salePrice
      );
    },
    0
  );

  const averageInvestment =
    unsoldVehicles.length > 0
      ? stockInvestment / unsoldVehicles.length
      : 0;

  return {
    stockCount: unsoldVehicles.length,
    stockInvestment,
    realizedProfit,
    averageInvestment,
  };
}, [vehicles]);

  return (
    <main className="main">
      <div className="stock-header">
  <div>
    <div className="eyebrow">VINIX / Stock</div>
    <h1>Vehicles</h1>
  </div>

  <div className="vehicle-header-actions">
    <Link
      href="/"
      className="secondary-button"
    >
      ← Dashboard
    </Link>

    <Link
      href="/vehicles/new"
      className="primary-button"
    >
      + Add vehicle
    </Link>
  </div>
</div>

      <section className="stock-toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Search make, model, VIN or registration..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="status-select"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="ALL">All statuses</option>
          <option value="PURCHASED">Purchased</option>
          <option value="IN_PREPARATION">In preparation</option>
          <option value="READY_FOR_SALE">Ready for sale</option>
          <option value="RESERVED">Reserved</option>
          <option value="SOLD">Sold</option>
          <option value="HOLD">On hold</option>
        </select>
      </section>

      <div className="stock-summary">
        <strong>{filteredVehicles.length}</strong>
        <span>
          {filteredVehicles.length === 1 ? "vehicle" : "vehicles"}
        </span>
      </div>

      <section className="stock-kpis">
  <div>
    <span>Stock vehicles</span>
    <strong>{stockKpis.stockCount}</strong>
  </div>

  <div>
    <span>Capital invested</span>
    <strong>
      {new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
      }).format(stockKpis.stockInvestment)}
    </strong>
  </div>

  <div>
    <span>Realized profit</span>
    <strong>
      {new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
      }).format(stockKpis.realizedProfit)}
    </strong>
  </div>

  <div>
    <span>Avg. investment</span>
    <strong>
      {new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
      }).format(stockKpis.averageInvestment)}
    </strong>
  </div>
</section>

      {loading && (
        <div className="empty-state">
          Loading stock...
        </div>
      )}

      {error && !loading && (
        <div className="error-state">
          {error}
        </div>
      )}

      {!loading && !error && filteredVehicles.length === 0 && (
        <div className="empty-state">
          No vehicles match your search.
        </div>
      )}

      {!loading && !error && filteredVehicles.length > 0 && (
        <section className="stock-grid">
          {filteredVehicles.map((vehicle) => {
            const acquisition = vehicle.acquisitions[0] ?? null;
            const sale = vehicle.sales[0] ?? null;

            const acquisitionCost = acquisition
              ? acquisitionTotal(acquisition)
              : 0;

            const expensesCost = expenseTotal(vehicle.expenses);

            const trueCost = acquisition
              ? totalInvestment(acquisition, vehicle.expenses)
              : expensesCost;

            const salePrice = sale
              ? Number(sale.salePrice)
              : 0;

            const profit = sale
              ? grossProfit(trueCost, salePrice)
              : 0;

            const margin = sale
              ? grossMargin(trueCost, salePrice)
              : 0;

            const roi = sale
              ? returnOnInvestment(trueCost, salePrice)
              : 0;
            const primaryPhoto =
              vehicle.photos.find((photo) => photo.isPrimary) ||
              vehicle.photos[0];

            return (
              <article className="vehicle-card" key={vehicle.id}>
                <div className="vehicle-image">
                  {primaryPhoto?.url ? (
                    <img
                      src={primaryPhoto.url}
                      alt={`${vehicle.make} ${vehicle.model}`}
                    />
                  ) : (
                    <div className="photo-placeholder">
                      <span>PHOTO</span>
                      <small>No photo yet</small>
                    </div>
                  )}
                </div>

                <div className="vehicle-content">
                  <div className="vehicle-top">
                    <span
                      className={`status-badge status-${vehicle.status.toLowerCase()}`}
                    >
                      {statusLabels[vehicle.status] || vehicle.status}
                    </span>

                    <span className="vehicle-location">
                      {vehicle.location || "No location"}
                    </span>
                  </div>

                  <h2>
                    {vehicle.make} {vehicle.model}
                  </h2>

                  {vehicle.version && (
                    <p className="vehicle-version">
                      {vehicle.version}
                    </p>
                  )}

                  <div className="vehicle-meta">
                    <div>
                      <span>VIN</span>
                      <strong>{vehicle.vin}</strong>
                    </div>

                    <div>
                      <span>Registration</span>
                      <strong>
                        {vehicle.registration || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Mileage</span>
                      <strong>
                        {vehicle.mileage
                          ? `${vehicle.mileage.toLocaleString("es-ES")} km`
                          : "—"}
                      </strong>
                    </div>
                  </div>

                  <div className="vehicle-financials">
                    <div>
                      <span>True cost</span>
                      <strong>
                        {acquisition
                          ? new Intl.NumberFormat("es-ES", {
                              style: "currency",
                              currency: "EUR",
                            }).format(trueCost)
                          : "—"}
                      </strong>
                    </div>

                    {sale ? (
                      <>
                        <div>
                          <span>Sale</span>
                          <strong>
                            {new Intl.NumberFormat("es-ES", {
                              style: "currency",
                              currency: "EUR",
                            }).format(salePrice)}
                          </strong>
                        </div>

                        <div>
                          <span>Profit</span>
                          <strong>
                            {new Intl.NumberFormat("es-ES", {
                              style: "currency",
                              currency: "EUR",
                            }).format(profit)}
                          </strong>
                        </div>
                      </>
                    ) : (
                    <>
                      <div>
                        <span>Expenses</span>
                        <strong>
                          {new Intl.NumberFormat("es-ES", {
                            style: "currency",
                            currency: "EUR",
                          }).format(expensesCost)}
                        </strong>
                      </div>

                      <div>
                        <span>Potential</span>
                        <strong>—</strong>
                      </div>
                    </>
                  )}
                  </div>

                  <Link
                    href={`/vehicles/${vehicle.id}`}
                    className="vehicle-link"
                  >
                    View vehicle →
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}