import type { SupplierPcfRequest, SupplierPcfRequestStatus } from "./types";

export type {
  SupplierPcfRequest,
  SupplierPcfRequestStatus,
} from "./types";

/** Public-safe view for the token portal (no internal review IDs). */
export type SupplierPcfPortalView = {
  requestId: string;
  partNumber: string;
  supplierName: string;
  status: SupplierPcfRequestStatus;
  message: string | null;
  declaredKgco2ePerUnit: number | null;
  declaredUnit: string | null;
  methodology: string | null;
  evidenceNotes: string | null;
  submittedAt: string | null;
  canSubmit: boolean;
};

export function newSupplierAccessToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `spc-${crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `spc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`;
}

export function toSupplierPcfPortalView(request: SupplierPcfRequest): SupplierPcfPortalView {
  return {
    requestId: request.id,
    partNumber: request.partNumber,
    supplierName: request.supplierName,
    status: request.status,
    message: request.message ?? null,
    declaredKgco2ePerUnit: request.declaredKgco2ePerUnit ?? null,
    declaredUnit: request.declaredUnit ?? null,
    methodology: request.methodology ?? null,
    evidenceNotes: request.evidenceNotes ?? null,
    submittedAt: request.submittedAt ?? null,
    canSubmit: request.status === "sent" || request.status === "submitted",
  };
}

export function assertValidSupplierDeclaration(input: {
  declaredKgco2ePerUnit?: number | null;
  declaredUnit?: string | null;
}): { declaredKgco2ePerUnit: number; declaredUnit: string } {
  const value = input.declaredKgco2ePerUnit;
  if (value == null || !Number.isFinite(value) || value < 0) {
    throw new Error("declaredKgco2ePerUnit must be a non-negative number");
  }
  const unit = (input.declaredUnit ?? "").trim() || "kg";
  return { declaredKgco2ePerUnit: value, declaredUnit: unit };
}

export function canTransitionSupplierPcf(
  from: SupplierPcfRequestStatus,
  to: SupplierPcfRequestStatus
): boolean {
  const allowed: Record<SupplierPcfRequestStatus, SupplierPcfRequestStatus[]> = {
    draft: ["sent", "cancelled"],
    sent: ["submitted", "cancelled"],
    submitted: ["approved", "rejected", "submitted"],
    approved: [],
    rejected: [],
    cancelled: [],
  };
  return allowed[from]?.includes(to) ?? false;
}
