import { loadBomLocal, newEntityId, updateBomLocal } from "@/lib/bom/local-store";
import type { BomAuditEvent } from "./types";

export type AuditWriteInput = {
  companyId: string;
  entityType: BomAuditEvent["entityType"];
  entityId: string;
  action: string;
  summary: string;
  actorId?: string | null;
  actorLabel?: string | null;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
};

/** Append-only audit event (local store). Never mutates prior rows. */
export function appendAuditEvent(input: AuditWriteInput): BomAuditEvent {
  const event: BomAuditEvent = {
    id: newEntityId("aud"),
    companyId: input.companyId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    actorId: input.actorId ?? null,
    actorLabel: input.actorLabel ?? null,
    summary: input.summary,
    beforeState: input.beforeState ?? null,
    afterState: input.afterState ?? null,
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
  };
  updateBomLocal(input.companyId, (s) => ({
    ...s,
    auditEvents: [...(s.auditEvents ?? []), event],
  }));
  return event;
}

export function listAuditEvents(
  companyId: string,
  filter?: { entityType?: string; entityId?: string; limit?: number }
): BomAuditEvent[] {
  const events = loadBomLocal(companyId).auditEvents ?? [];
  let out = events.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filter?.entityType) out = out.filter((e) => e.entityType === filter.entityType);
  if (filter?.entityId) out = out.filter((e) => e.entityId === filter.entityId);
  if (filter?.limit) out = out.slice(0, filter.limit);
  return out;
}
