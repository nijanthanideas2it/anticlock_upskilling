import { z } from 'zod';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const TicketAttachmentParams = z.object({
  ticketId: z.string().uuid('Invalid ticket ID'),
});

export const AttachmentParams = z.object({
  ticketId: z.string().uuid('Invalid ticket ID'),
  id: z.string().uuid('Invalid attachment ID'),
});

export const PresignAttachmentBody = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z
    .number()
    .int()
    .min(1)
    .max(MAX_FILE_SIZE, `File size must not exceed ${MAX_FILE_SIZE / 1024 / 1024} MB`),
  mimeType: z.enum(ALLOWED_MIME_TYPES, {
    errorMap: () => ({ message: 'File type not allowed' }),
  }),
});

export const ConfirmAttachmentBody = z.object({
  storageKey: z.string().min(1).max(500),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().min(1).max(MAX_FILE_SIZE),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
});

export type PresignAttachmentBodyType = z.infer<typeof PresignAttachmentBody>;
export type ConfirmAttachmentBodyType = z.infer<typeof ConfirmAttachmentBody>;
