import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create test users
  const users = [
    {
      telegramId: '2111112',
      firstName: 'Test User',
      lastName: 'Demo',
      username: 'testuser',
      balance: 50,
    },
    {
      telegramId: '21155555',
      firstName: 'Sam55555',
      lastName: 'Tes44555',
      username: 'johndo45555',
      balance: 100,
    }
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { telegramId: userData.telegramId },
      update: userData,
      create: userData,
    });
    console.log('Created/Updated user:', user);
  }

  // Fetch all users
  const allUsers = await prisma.user.findMany({
    select: { telegramId: true, firstName: true, balance: true }
  });
  console.log('All users:', allUsers);
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })