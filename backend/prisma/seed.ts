import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@sendika.local';

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log('Admin user already exists');
    return;
  }

  const passwordHash = await bcrypt.hash('Admin123!', 10);

  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      firstName: 'Sistem',
      lastName: 'Admin',
      roles: [Role.ADMIN],
    },
  });

  console.log('Admin user created with email:', adminEmail);
  console.log('Password: Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
