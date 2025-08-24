import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a new user
  const user = await prisma.user.create({
    data: {
      telegramId: '2111112',
      firstName: 'Sam111',
      lastName: 'Test111',
      username: 'johndoe111',
      // balance, withdrawalAmount, isActive, createdAt, updatedAt will use defaults
    },
  })
  console.log('Created user:', user)

  // Fetch all users
  const allUsers = await prisma.user.findMany({
    
});
  console.log('All users:', allUsers)
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