import { BaseDocument } from './base-model';

export type AuditLogDetails = object | string | number | boolean | null | undefined;

export interface AuditLog extends BaseDocument {
  userId: { _id: string; username: string };
  username: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  details: AuditLogDetails;
  createdAt: string;
}
