"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
          throw new Error(data.error || "Unable to load vehicle.");
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

            <span
              className={`status-badge status-${vehicle.status.toLowerCase()}`}
            >
              {statusLabels[vehicle.status] || vehicle.status}
            </span>
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