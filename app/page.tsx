"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DashboardData = {
  stockCount: number;
  capitalInvested: number;
  realizedProfit: number;
  soldCount: number;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);

export default function Home() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch(
          "/api/dashboard"
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Unable to load dashboard."
          );
        }

        setDashboard(data.dashboard);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">VINIX</div>

        <nav className="nav">
          <Link href="/">Dashboard</Link>
          <Link href="/stock">Stock</Link>
        </nav>
      </aside>

      <main className="main">
        <div className="eyebrow">
          Vehicle Intelligence & Inventory System
        </div>

        <h1>Dashboard</h1>

        {error && (
          <div className="error-state">
            {error}
          </div>
        )}

        {loading && (
          <div className="empty-state">
            Loading dashboard...
          </div>
        )}

        {!loading && !error && dashboard && (
          <section className="cards">
            <div className="card">
              <div className="card-label">
                Vehicles in stock
              </div>

              <div className="card-value">
                {dashboard.stockCount}
              </div>
            </div>

            <div className="card">
              <div className="card-label">
                Capital invested
              </div>

              <div className="card-value">
                {formatMoney(
                  dashboard.capitalInvested
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-label">
                Realized profit
              </div>

              <div className="card-value">
                {formatMoney(
                  dashboard.realizedProfit
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-label">
                Sold vehicles
              </div>

              <div className="card-value">
                {dashboard.soldCount}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}