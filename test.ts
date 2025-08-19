import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()




const prisma = new PrismaClient()
const db = new PrismaClient()

async function main() {
  await prisma.user.create({
    data: {
      'email': 'NextJS@example44.com',
            'firstName': 'Test NextJ4S1',
            'telegramId': 'Nextg4u4y674ff74r466746TEST'
     },
  })

  const allUsers = await prisma.user.findMany({
    include: {
      posts: true,
    },
  })
  console.dir(allUsers, { depth: null })
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