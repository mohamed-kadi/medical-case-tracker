export interface AuditEvent {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  actorUsername: string;
  details: string | null;
  createdAt: string;
}

export interface AuditEventFilters {
  entityType?: string;
  action?: string;
  actor?: string;
  limit?: number;
}
