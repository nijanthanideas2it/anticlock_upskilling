import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ticketService from '../services/ticket.service';
import { useAuthStore } from '../store/auth.store';

export function useTickets(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => ticketService.listTickets(params),
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketService.getTicket(id),
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ticketService.createTicket,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['tickets'] }); },
  });
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { status: string; resolutionNote?: string } }) =>
      ticketService.updateStatus(id, body),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['ticket', vars.id] });
      void qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useClaimTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ticketService.claimTicket(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['tickets'] }); },
  });
}

export function useAssignTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assigneeId }: { id: string; assigneeId: string }) =>
      ticketService.assignTicket(id, assigneeId),
    onSuccess: (_d, vars) => { void qc.invalidateQueries({ queryKey: ['ticket', vars.id] }); },
  });
}

export function useEscalateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      ticketService.escalateTicket(id, reason),
    onSuccess: (_d, vars) => { void qc.invalidateQueries({ queryKey: ['ticket', vars.id] }); },
  });
}

export function useComments(ticketId: string, page = 1) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['comments', ticketId, page, user?.id],
    queryFn: () => ticketService.listComments(ticketId, page),
    enabled: !!ticketId && !!user?.id,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, body }: { ticketId: string; body: { content: string; visibility: string } }) =>
      ticketService.createComment(ticketId, body),
    onSuccess: (_d, vars) => { void qc.invalidateQueries({ queryKey: ['comments', vars.ticketId] }); },
  });
}
