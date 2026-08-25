"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewVehiclePage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [vin, setVin] = useState("");
  const [registration, setRegistration] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [version, setVersion] = useState("");

  const [firstRegistration, setFirstRegistration] =
    useState("");
  const [mileage, setMileage] = useState("");
  const [fuel, setFuel] = useState("");
  const [engine, setEngine] = useState("");
  const [transmission, setTransmission] = useState("");
  const [colour, setColour] = useState("");
  const [location, setLocation] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vin,
          registration:
            registration || undefined,
          make,
          model,
          version:
            version || undefined,
          firstRegistration:
            firstRegistration || undefined,
          mileage:
            mileage !== ""
              ? Number(mileage)
              : undefined,
          fuel:
            fuel || undefined,
          engine:
            engine || undefined,
          transmission:
            transmission || undefined,
          colour:
            colour || undefined,
          location:
            location || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to create vehicle."
        );
      }

      router.push(
        `/vehicles/${data.vehicle.id}`
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create vehicle."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="main">
      <Link
        href="/stock"
        className="back-link"
      >
        ← Back to stock
      </Link>

      <div className="eyebrow">
        VINIX / STOCK / NEW VEHICLE
      </div>

      <div className="page-header">
        <div>
          <h1>Add vehicle</h1>
          <p className="muted-text">
            Create a new vehicle record.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="workspace-card"
      >
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              Vehicle identity
            </div>
            <h2>Basic information</h2>
          </div>
        </div>

        <div className="form-grid">
          <label className="form-field">
            <span>VIN *</span>
            <input
              value={vin}
              onChange={(event) =>
                setVin(event.target.value)
              }
              placeholder="e.g. WVWZZZ1KZ..."
              required
            />
          </label>

          <label className="form-field">
            <span>Registration</span>
            <input
              value={registration}
              onChange={(event) =>
                setRegistration(
                  event.target.value
                )
              }
              placeholder="e.g. 1234 ABC"
            />
          </label>

          <label className="form-field">
            <span>Make *</span>
            <input
              value={make}
              onChange={(event) =>
                setMake(event.target.value)
              }
              placeholder="Volkswagen"
              required
            />
          </label>

          <label className="form-field">
            <span>Model *</span>
            <input
              value={model}
              onChange={(event) =>
                setModel(event.target.value)
              }
              placeholder="Golf"
              required
            />
          </label>

          <label className="form-field form-field-wide">
            <span>Version</span>
            <input
              value={version}
              onChange={(event) =>
                setVersion(
                  event.target.value
                )
              }
              placeholder="1.6 TDI"
            />
          </label>

          <label className="form-field">
            <span>First registration</span>
            <input
              type="date"
              value={firstRegistration}
              onChange={(event) =>
                setFirstRegistration(
                  event.target.value
                )
              }
            />
          </label>

          <label className="form-field">
            <span>Mileage</span>
            <input
              type="number"
              min="0"
              step="1"
              value={mileage}
              onChange={(event) =>
                setMileage(
                  event.target.value
                )
              }
              placeholder="125000"
            />
          </label>

          <label className="form-field">
            <span>Fuel</span>
            <select
              value={fuel}
              onChange={(event) =>
                setFuel(event.target.value)
              }
            >
              <option value="">
                Select fuel type
              </option>
              <option value="PETROL">
                Petrol
              </option>
              <option value="DIESEL">
                Diesel
              </option>
              <option value="HYBRID">
                Hybrid
              </option>
              <option value="PLUG_IN_HYBRID">
                Plug-in hybrid
              </option>
              <option value="ELECTRIC">
                Electric
              </option>
              <option value="LPG">
                LPG
              </option>
              <option value="OTHER">
                Other
              </option>
            </select>
          </label>

          <label className="form-field">
            <span>Engine</span>
            <input
              value={engine}
              onChange={(event) =>
                setEngine(
                  event.target.value
                )
              }
              placeholder="1.6"
            />
          </label>

          <label className="form-field">
            <span>Transmission</span>
            <input
              value={transmission}
              onChange={(event) =>
                setTransmission(
                  event.target.value
                )
              }
              placeholder="Manual"
            />
          </label>

          <label className="form-field">
            <span>Colour</span>
            <input
              value={colour}
              onChange={(event) =>
                setColour(
                  event.target.value
                )
              }
              placeholder="Black"
            />
          </label>

          <label className="form-field">
            <span>Location</span>
            <input
              value={location}
              onChange={(event) =>
                setLocation(
                  event.target.value
                )
              }
              placeholder="Málaga"
            />
          </label>
        </div>

        {error && (
          <div
            className="form-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="form-actions">
          <Link
            href="/stock"
            className="secondary-button"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving
              ? "Creating..."
              : "Create vehicle"}
          </button>
        </div>
      </form>
    </main>
  );
}