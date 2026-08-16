"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AcquisitionPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
  const [supplier, setSupplier] = useState("");
  const [auctionHouse, setAuctionHouse] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [auctionFee, setAuctionFee] = useState("");
  const [transportCost, setTransportCost] = useState("");
  const [taxCost, setTaxCost] = useState("");
  const [otherCost, setOtherCost] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setSaving(true);
  setError("");

  try {
    const response = await fetch(
      `/api/vehicles/${params.id}/acquisition`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplier: supplier || undefined,
          auctionHouse: auctionHouse || undefined,
          invoiceNumber: invoiceNumber || undefined,
          invoiceDate: invoiceDate || undefined,
          purchasePrice: Number(purchasePrice),
          auctionFee: Number(auctionFee || 0),
          transportCost: Number(transportCost || 0),
          taxCost: Number(taxCost || 0),
          otherCost: Number(otherCost || 0),
          currency: "EUR",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Unable to create acquisition."
      );
    }

    router.push(`/vehicles/${params.id}`);
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Unable to create acquisition."
    );
  } finally {
    setSaving(false);
  }
}

  return (
    <main className="main">
      <Link href="/stock" className="back-link">
        ← Back to stock
      </Link>

      <div className="eyebrow">
        VINIX / ACQUISITION
      </div>

      <div className="page-header">
        <div>
          <h1>Add acquisition</h1>
          <p className="muted-text">
            Record the cost of acquiring this vehicle.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="workspace-card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Source</div>
            <h2>Purchase information</h2>
          </div>
        </div>

        <div className="form-grid">
          <label className="form-field">
            <span>Supplier</span>
            <input
              value={supplier}
              onChange={(event) =>
                setSupplier(event.target.value)
              }
              placeholder="Supplier name"
            />
          </label>

          <label className="form-field">
            <span>Auction house</span>
            <input
              value={auctionHouse}
              onChange={(event) =>
                setAuctionHouse(event.target.value)
              }
              placeholder="BCA"
            />
          </label>

          <label className="form-field">
            <span>Invoice number</span>
            <input
              value={invoiceNumber}
              onChange={(event) =>
                setInvoiceNumber(event.target.value)
              }
              placeholder="Invoice number"
            />
          </label>

          <label className="form-field">
            <span>Invoice date</span>
            <input
                type="date"
                value={invoiceDate}
                onChange={(event) =>
                setInvoiceDate(event.target.value)
                }
            />
           </label>
        </div>

        <div className="section-heading acquisition-form-section">
          <div>
            <div className="eyebrow">Costs</div>
            <h2>Acquisition costs</h2>
          </div>
        </div>

        <div className="form-grid">
          <label className="form-field">
            <span>Purchase price *</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={purchasePrice}
              onChange={(event) =>
                setPurchasePrice(event.target.value)
              }
              placeholder="0.00"
              required
            />
          </label>

          <label className="form-field">
            <span>Auction fee</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={auctionFee}
              onChange={(event) =>
                setAuctionFee(event.target.value)
              }
              placeholder="0.00"
            />
          </label>

          <label className="form-field">
            <span>Transport</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={transportCost}
              onChange={(event) =>
                setTransportCost(event.target.value)
              }
              placeholder="0.00"
            />
          </label>

          <label className="form-field">
            <span>Tax</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={taxCost}
              onChange={(event) =>
                setTaxCost(event.target.value)
              }
              placeholder="0.00"
            />
          </label>

          <label className="form-field">
            <span>Other costs</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={otherCost}
              onChange={(event) =>
                setOtherCost(event.target.value)
              }
              placeholder="0.00"
            />
          </label>
        </div>

        {error && (
            <div className="form-error">
                {error}
            </div>
        )}

        <div className="form-actions">
          <Link href="/stock" className="secondary-button">
            Cancel
          </Link>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
            >
            {saving ? "Saving..." : "Save acquisition"}
            </button>
        </div>
      </form>
    </main>
  );
}