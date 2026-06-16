import 'dotenv/config';
import app from './config/app';
import { startSlaMonitor } from './jobs/sla-monitor.job';

const PORT = parseInt(process.env['PORT'] ?? '4000', 10);

app.listen(PORT, () => {
  console.log(`ServiceDesk API running on http://localhost:${PORT}`);
  console.log(`Swagger docs:  http://localhost:${PORT}/api/docs`);
  startSlaMonitor();
});
