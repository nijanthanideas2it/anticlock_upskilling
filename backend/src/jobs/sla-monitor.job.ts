import cron from 'node-cron';
import { findTicketsNeedingEvaluation, evaluateTicket } from '../services/sla.service';

export function startSlaMonitor(): void {
  cron.schedule('* * * * *', async () => {
    try {
      const tickets = await findTicketsNeedingEvaluation();
      await Promise.allSettled(tickets.map((t) => evaluateTicket(t.id)));
    } catch (err) {
      console.error('[sla-monitor] Error during evaluation:', err);
    }
  });

  console.log('[sla-monitor] SLA monitoring started (every 60s)');
}
