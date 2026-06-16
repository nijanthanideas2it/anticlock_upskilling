import { PrismaClient, Role, TicketPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  await seedAdmin();
  await seedCategories();
  await seedSLAPolicies();
  await seedBusinessHours();

  console.log('Seeding complete.');
}

async function seedAdmin(): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@servicedesk.local' } });
  if (existing) return;

  const passwordHash = await bcrypt.hash('Admin@1234', 12);

  await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@servicedesk.local',
      passwordHash,
      role: Role.ADMIN,
      isEmailVerified: true,
      isActive: true,
    },
  });

  console.log('  ✓ Default admin created (admin@servicedesk.local / Admin@1234)');
}

async function seedCategories(): Promise<void> {
  const defaults = ['Technical', 'Billing', 'General', 'Feature Request'];

  for (const name of defaults) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, isActive: true },
    });
  }

  console.log('  ✓ Default categories seeded:', defaults.join(', '));
}

async function seedSLAPolicies(): Promise<void> {
  const policies: Array<{
    name: string;
    priority: TicketPriority;
    maxResponseMinutes: number;
    maxResolutionMinutes: number;
    businessHoursOnly: boolean;
  }> = [
    {
      name: 'Low Priority SLA',
      priority: TicketPriority.LOW,
      maxResponseMinutes: 480,     // 8 hours
      maxResolutionMinutes: 2880,  // 48 hours
      businessHoursOnly: true,
    },
    {
      name: 'Medium Priority SLA',
      priority: TicketPriority.MEDIUM,
      maxResponseMinutes: 240,     // 4 hours
      maxResolutionMinutes: 1440,  // 24 hours
      businessHoursOnly: true,
    },
    {
      name: 'High Priority SLA',
      priority: TicketPriority.HIGH,
      maxResponseMinutes: 60,      // 1 hour
      maxResolutionMinutes: 480,   // 8 hours
      businessHoursOnly: true,
    },
    {
      name: 'Critical Priority SLA',
      priority: TicketPriority.CRITICAL,
      maxResponseMinutes: 15,      // 15 minutes
      maxResolutionMinutes: 120,   // 2 hours
      businessHoursOnly: false,    // 24/7
    },
  ];

  for (const policy of policies) {
    await prisma.slaPolicy.upsert({
      where: { priority: policy.priority },
      update: {},
      create: { ...policy, warningThreshold: 0.8, isActive: true },
    });
  }

  console.log('  ✓ Default SLA policies seeded (LOW / MEDIUM / HIGH / CRITICAL)');
}

async function seedBusinessHours(): Promise<void> {
  // Monday–Friday 09:00–17:00 UTC; weekends inactive
  const schedule = [
    { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', isActive: false }, // Sunday
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true },  // Monday
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isActive: true },  // Tuesday
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isActive: true },  // Wednesday
    { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isActive: true },  // Thursday
    { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isActive: true },  // Friday
    { dayOfWeek: 6, startTime: '09:00', endTime: '17:00', isActive: false }, // Saturday
  ];

  for (const entry of schedule) {
    await prisma.businessHours.upsert({
      where: { dayOfWeek: entry.dayOfWeek },
      update: {},
      create: { ...entry, timezone: 'UTC' },
    });
  }

  console.log('  ✓ Default business hours seeded (Mon–Fri 09:00–17:00 UTC)');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
