import type {
  Role,
  TicketStatus,
  TicketPriority,
  SlaStatus,
  CommentVisibility,
  EscalationType,
  NotificationChannel,
  NotificationEvent,
} from '@prisma/client';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface TokenPayload {
  id: string;
  email: string;
  role: Role;
  customerId?: string;
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  isAvailable: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CustomerDTO {
  id: string;
  companyName: string | null;
  primaryContact: string;
  phone: string | null;
  tier: string;
  user: Pick<UserDTO, 'id' | 'email' | 'isActive'>;
  createdAt: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  isActive: boolean;
}

export interface SlaPolicyDTO {
  id: string;
  name: string;
  priority: TicketPriority;
  maxResponseMinutes: number;
  maxResolutionMinutes: number;
  businessHoursOnly: boolean;
  warningThreshold: number;
  isActive: boolean;
  createdAt: string;
}

export interface TicketDTO {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  slaStatus: SlaStatus | null;
  category: CategoryDTO;
  customer: Pick<CustomerDTO, 'id' | 'companyName' | 'primaryContact'>;
  assignee: Pick<UserDTO, 'id' | 'name'> | null;
  slaPolicy: Pick<SlaPolicyDTO, 'id' | 'name'> | null;
  slaResponseDue: string | null;
  slaResolutionDue: string | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  csatScore: number | null;
  csatSubmittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDTO {
  id: string;
  content: string;
  visibility: CommentVisibility;
  author: Pick<UserDTO, 'id' | 'name' | 'role'>;
  attachments: AttachmentDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentDTO {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
  createdAt: string;
}

export interface EscalationEventDTO {
  id: string;
  type: EscalationType;
  reason: string;
  escalatedBy: Pick<UserDTO, 'id' | 'name'> | null;
  escalatedTo: Pick<UserDTO, 'id' | 'name'>;
  createdAt: string;
}

export interface NotificationDTO {
  id: string;
  channel: NotificationChannel;
  eventType: NotificationEvent;
  payload: Record<string, unknown>;
  isRead: boolean;
  sentAt: string | null;
  readAt: string | null;
  ticket: Pick<TicketDTO, 'id' | 'referenceNumber'> | null;
  createdAt: string;
}

export interface AuditLogDTO {
  id: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: Pick<UserDTO, 'id' | 'name'>;
  changedAt: string;
}

export interface BusinessHoursEntryDTO {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface BusinessHoursDTO {
  timezone: string;
  schedule: BusinessHoursEntryDTO[];
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─── Error ───────────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

// ─── Express augmentation ────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
