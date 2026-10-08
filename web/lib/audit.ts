import { AuditEvent, UserRole } from "./types";
import { randomUUID } from "crypto";

export function buildAuditEvent(input: {
  actorId: string;
  actorRole: UserRole | "system";
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}): AuditEvent {
  return {
    id: randomUUID(),
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata,
    createdAt: new Date().toISOString(),
  };
}
