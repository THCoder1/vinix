"use client";

import { useEffect, useState } from "react";

type DocumentType =
  | "AUCTION_INVOICE"
  | "PURCHASE_INVOICE"
  | "TRANSPORT_INVOICE"
  | "WORKSHOP_INVOICE"
  | "REGISTRATION"
  | "ITV"
  | "WARRANTY"
  | "SALES_INVOICE"
  | "OTHER";

type VehicleDocument = {
  id: string;
  type: DocumentType;
  filename: string;
  mimeType: string;
  source: string | null;
  uploadedAt: string;
};

type VehicleDocumentsProps = {
  vehicleId: string;
};

const documentTypeLabels: Record<
  DocumentType,
  string
> = {
  AUCTION_INVOICE: "Auction / Order",
  PURCHASE_INVOICE: "Purchase invoice",
  TRANSPORT_INVOICE: "Transport invoice",
  WORKSHOP_INVOICE: "Workshop invoice",
  REGISTRATION: "Registration",
  ITV: "ITV",
  WARRANTY: "Warranty",
  SALES_INVOICE: "Sales invoice",
  OTHER: "Other",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function VehicleDocuments({
  vehicleId,
}: VehicleDocumentsProps) {
  const [documents, setDocuments] = useState<
    VehicleDocument[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDocuments() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/vehicles/${vehicleId}/documents`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load documents."
        );
      }

      setDocuments(data.documents);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load documents."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, [vehicleId]);

  async function openDocument(
    documentId: string
  ) {
    try {
      const response = await fetch(
        `/api/vehicles/${vehicleId}/documents/${documentId}/url`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to open document."
        );
      }

      window.open(
        data.document.url,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to open document."
      );
    }
  }

  return (
    <section className="workspace-card">
      <div className="section-heading">
        <div>
          <div className="eyebrow">Documents</div>
          <h2>Vehicle documents</h2>
        </div>
      </div>

      {loading && (
        <p className="muted-text">
          Loading documents...
        </p>
      )}

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        documents.length === 0 && (
          <div className="empty-state">
            <p>No documents uploaded.</p>
          </div>
        )}

      {!loading &&
        documents.length > 0 && (
          <div className="document-list">
            {documents.map((document) => (
              <div
                key={document.id}
                className="document-item"
              >
                <div className="document-main">
                  <strong>
                    {document.filename}
                  </strong>

                  <div className="document-meta">
                    <span>
                      {documentTypeLabels[
                        document.type
                      ] || document.type}
                    </span>

                    {document.source && (
                      <span>
                        {document.source}
                      </span>
                    )}

                    <span>
                      {formatDate(
                        document.uploadedAt
                      )}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    openDocument(document.id)
                  }
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}
    </section>
  );
}