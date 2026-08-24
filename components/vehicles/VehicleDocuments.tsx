"use client";

import { ChangeEvent, useEffect, useState } from "react";

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

const documentTypeLabels: Record<DocumentType, string> = {
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
  const [documents, setDocuments] = useState<VehicleDocument[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showUploadForm, setShowUploadForm] =
    useState(false);

  const [documentType, setDocumentType] =
    useState<DocumentType>("OTHER");

  const [source, setSource] = useState("");

  const [file, setFile] =
    useState<File | null>(null);

  const [uploading, setUploading] = useState(false);

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

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setFile(event.target.files?.[0] ?? null);
  }

  async function uploadDocument() {
    if (!file) {
      setError("Select a document first.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("type", documentType);

      if (source.trim()) {
        formData.append("source", source.trim());
      }

      const response = await fetch(
        `/api/vehicles/${vehicleId}/documents`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to upload vehicle document."
        );
      }

      setDocuments((current) => [
        data.document,
        ...current,
      ]);

      setFile(null);
      setSource("");
      setDocumentType("OTHER");
      setShowUploadForm(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload vehicle document."
      );
    } finally {
      setUploading(false);
    }
  }

  async function openDocument(
    documentId: string
  ) {
    try {
      setError("");

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

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            setShowUploadForm((current) => !current)
          }
        >
          {showUploadForm
            ? "Cancel"
            : "+ Upload document"}
        </button>
      </div>

      {showUploadForm && (
        <div className="document-upload-form">
          <div className="expense-form-grid">
            <label>
              Document type
              <select
                value={documentType}
                onChange={(event) =>
                  setDocumentType(
                    event.target.value as DocumentType
                  )
                }
                disabled={uploading}
              >
                {Object.entries(
                  documentTypeLabels
                ).map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Source
              <input
                type="text"
                value={source}
                onChange={(event) =>
                  setSource(event.target.value)
                }
                placeholder="AUTO1, workshop, gestoría..."
                disabled={uploading}
              />
            </label>

            <label>
              File
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
          </div>

          {file && (
            <p className="muted-text">
              Selected: {file.name}
            </p>
          )}

          <div className="expense-form-actions">
            <button
              type="button"
              className="primary-button"
              onClick={uploadDocument}
              disabled={uploading || !file}
            >
              {uploading
                ? "Uploading..."
                : "Upload document"}
            </button>
          </div>
        </div>
      )}

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