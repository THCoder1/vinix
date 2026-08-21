import { NextResponse } from "next/server";
import { DocumentType } from "@prisma/client";

import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const documentTypeValues = new Set<string>(
  Object.values(DocumentType)
);

function getExtension(
  filename: string,
  mimeType: string
) {
  const filenameExtension =
    filename.split(".").pop()?.toLowerCase();

  if (
    filenameExtension &&
    /^[a-z0-9]{1,8}$/.test(filenameExtension)
  ) {
    return filenameExtension;
  }

  switch (mimeType) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  const auth = await requirePermission("UPLOAD_DOCUMENT");

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id: vehicleId } = await context.params;

    const vehicle = await db.vehicle.findUnique({
      where: {
        id: vehicleId,
      },
      select: {
        id: true,
        vin: true,
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        {
          success: false,
          error: "Vehicle not found.",
        },
        { status: 404 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");
    const type = formData.get("type");
    const source = formData.get("source");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "No document file was provided.",
        },
        { status: 400 }
      );
    }

    if (typeof type !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Document type is required.",
        },
        { status: 400 }
      );
    }

    if (!documentTypeValues.has(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid document type.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unsupported document type. Use PDF, JPEG, PNG, or WebP.",
        },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "The uploaded document is empty.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Document is too large. Maximum size is 20 MB.",
        },
        { status: 400 }
      );
    }

    const documentId = crypto.randomUUID();
    const extension = getExtension(
      file.name,
      file.type
    );

    const storagePath =
      `${vehicleId}/${documentId}/original.${extension}`;

    const supabase = await createClient();

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } =
      await supabase.storage
        .from("vehicle-documents")
        .upload(storagePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

    if (uploadError) {
      console.error(
        "VINIX vehicle document upload error:",
        {
          message: uploadError.message,
          name: uploadError.name,
          statusCode: uploadError.statusCode,
          error: uploadError,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            uploadError.message ||
            "Unable to upload vehicle document.",
        },
        { status: 500 }
      );
    }

    try {
      const document =
        await db.$transaction(async (tx) => {
          const createdDocument =
            await tx.document.create({
              data: {
                vehicleId,
                type: type as DocumentType,
                filename: file.name,
                storagePath,
                mimeType: file.type,
                source:
                  typeof source === "string" &&
                  source.trim()
                    ? source.trim()
                    : null,
                ocrStatus: "PENDING",
              },
            });

          await tx.vehicleEvent.create({
            data: {
              vehicleId,
              eventType: "DOCUMENT_UPLOADED",
              description: `Document uploaded: ${file.name}`,
              userId: auth.user.id,
            },
          });

          return createdDocument;
        });

      return NextResponse.json(
        {
          success: true,
          document,
        },
        { status: 201 }
      );
    } catch (databaseError) {
      await supabase.storage
        .from("vehicle-documents")
        .remove([storagePath]);

      throw databaseError;
    }
  } catch (error) {
    console.error(
      "VINIX vehicle document creation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to create vehicle document.",
      },
      { status: 500 }
    );
  }
}