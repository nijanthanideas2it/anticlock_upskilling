import nodemailer from 'nodemailer';
import type { NotificationEvent } from '@prisma/client';

function createTransport() {
  const host = process.env['SMTP_HOST'];
  if (host) {
    return nodemailer.createTransport({
      host,
      port: parseInt(process.env['SMTP_PORT'] ?? '587', 10),
      secure: process.env['SMTP_SECURE'] === 'true',
      auth: {
        user: process.env['SMTP_USER'],
        pass: process.env['SMTP_PASS'],
      },
    });
  }
  return nodemailer.createTransport({ jsonTransport: true });
}

const transporter = createTransport();

interface EmailPayload {
  ticketReferenceNumber?: string;
  ticketTitle?: string;
  actorName?: string;
  message?: string;
  actionUrl?: string;
}

function buildTemplate(eventType: NotificationEvent, payload: EmailPayload): { subject: string; html: string } {
  const base = (body: string) => `<div style="font-family:sans-serif;max-width:600px;margin:auto;">${body}<hr/><p style="color:#888;font-size:12px;">ServiceDesk CRM</p></div>`;
  const ref = payload.ticketReferenceNumber ? `[${payload.ticketReferenceNumber}]` : '';
  const url = payload.actionUrl ?? process.env['FRONTEND_URL'] ?? '#';

  const templates: Partial<Record<NotificationEvent, { subject: string; html: string }>> = {
    TICKET_CREATED: { subject: `Ticket created ${ref}`, html: base(`<h2>Your ticket has been received</h2><p>Reference: <strong>${payload.ticketReferenceNumber}</strong></p><a href="${url}">View Ticket</a>`) },
    TICKET_ASSIGNED: { subject: `Ticket assigned ${ref}`, html: base(`<h2>Agent assigned</h2><p>${payload.actorName} has been assigned to ticket <strong>${payload.ticketReferenceNumber}</strong>.</p><a href="${url}">View Ticket</a>`) },
    TICKET_REPLY: { subject: `New reply ${ref}`, html: base(`<h2>New reply from ${payload.actorName}</h2><p>${payload.message}</p><a href="${url}">View Ticket</a>`) },
    TICKET_RESOLVED: { subject: `Ticket resolved ${ref}`, html: base(`<h2>Your ticket has been resolved</h2><p><strong>Resolution:</strong> ${payload.message}</p><a href="${url}">View &amp; Rate</a>`) },
    SLA_WARNING: { subject: `SLA Warning: ${ref}`, html: base(`<h2>SLA Warning</h2><p>Ticket <strong>${payload.ticketReferenceNumber}</strong> is approaching its deadline.</p><a href="${url}">View Ticket</a>`) },
    SLA_BREACHED: { subject: `SLA Breached: ${ref}`, html: base(`<h2>SLA Breach</h2><p>Ticket <strong>${payload.ticketReferenceNumber}</strong> has breached its SLA.</p><a href="${url}">View Ticket</a>`) },
    TICKET_ESCALATED: { subject: `Ticket escalated ${ref}`, html: base(`<h2>Ticket Escalated</h2><p>Ticket <strong>${payload.ticketReferenceNumber}</strong> has been escalated to you.</p><a href="${url}">View Ticket</a>`) },
    CSAT_REQUEST: { subject: `Rate your experience ${ref}`, html: base(`<h2>How did we do?</h2><p>Your ticket has been resolved. Please rate your experience.</p><a href="${url}">Rate Now</a>`) },
    AGENT_INVITED: { subject: 'You have been invited to ServiceDesk CRM', html: base(`<h2>Welcome</h2><p>Click below to activate your account.</p><a href="${payload.actionUrl}">Accept Invitation</a><p><small>Expires in 48 hours.</small></p>`) },
    PASSWORD_RESET: { subject: 'Reset your password', html: base(`<h2>Password Reset</h2><p>Click below to reset your password. Expires in 1 hour.</p><a href="${payload.actionUrl}">Reset Password</a>`) },
  };

  return templates[eventType] ?? { subject: 'ServiceDesk Notification', html: base(`<p>${payload.message ?? ''}</p>`) };
}

export async function sendEmail(to: string, eventType: NotificationEvent, payload: EmailPayload): Promise<void> {
  const from = process.env['SMTP_FROM_EMAIL'] ?? process.env['AWS_SES_FROM_EMAIL'] ?? 'no-reply@servicedesk.local';
  const { subject, html } = buildTemplate(eventType, payload);
  try {
    await transporter.sendMail({ from, to, subject, html });
  } catch (err) {
    console.error('[email.provider] Failed to send email to', to, err);
  }
}
