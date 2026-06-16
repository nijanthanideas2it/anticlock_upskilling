export type Role = 'ADMIN' | 'SUPPORT_MANAGER' | 'SUPPORT_AGENT' | 'CUSTOMER';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SlaStatus = 'WARNING' | 'BREACHED';
export type CommentVisibility = 'PUBLIC' | 'INTERNAL';

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

export interface CategoryDTO { id: string; name: string; isActive: boolean }

export interface SlaPolicyDTO {
  id: string; name: string; priority: TicketPriority;
  maxResponseMinutes: number; maxResolutionMinutes: number;
  businessHoursOnly: boolean; warningThreshold: number; isActive: boolean;
}

export interface TicketDTO {
  id: string; referenceNumber: string; title: string; description: string;
  status: TicketStatus; priority: TicketPriority; slaStatus: SlaStatus | null;
  category: CategoryDTO;
  customer: { id: string; companyName: string | null; primaryContact: string; userId?: string };
  assignee: { id: string; name: string } | null;
  slaPolicy: { id: string; name: string } | null;
  slaResponseDue: string | null; slaResolutionDue: string | null;
  firstResponseAt: string | null; resolvedAt: string | null;
  csatScore: number | null; csatSubmittedAt: string | null;
  csatWindowExpiresAt: string | null;
  createdAt: string; updatedAt: string;
}

export interface CommentDTO {
  id: string; content: string; visibility: CommentVisibility;
  author: { id: string; name: string; role: Role };
  attachments: AttachmentDTO[];
  createdAt: string; updatedAt: string;
}

export interface AttachmentDTO {
  id: string; fileName: string; fileSize: number; mimeType: string;
  storageKey: string; createdAt: string;
}

export interface NotificationDTO {
  id: string; channel: 'EMAIL' | 'IN_APP'; eventType: string;
  payload: Record<string, unknown>; isRead: boolean;
  sentAt: string | null; readAt: string | null;
  ticket: { id: string; referenceNumber: string } | null;
  createdAt: string;
}

export interface PaginationMeta {
  total: number; page: number; limit: number; totalPages: number;
}

export interface PaginatedResponse<T> { data: T[]; meta: PaginationMeta }
