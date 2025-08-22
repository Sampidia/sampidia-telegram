const { PrismaClient } = require('@prisma/client');
import { withAccelerate } from '@prisma/extension-accelerate';
const prisma = new PrismaClient().$extends(withAccelerate());
async function main() {
    // Create a new user
    const user = await prisma.user.create({
        data: {
            telegramId: '11111111111111111',
            firstName: 'Sam22211',
            lastName: 'Test22111',
            username: 'johndoe22111',
            // balance, withdrawalAmount, isActive, createdAt, updatedAt will use defaults
        },
    });
    console.log('Created user:', user);
    // Fetch all users
    const allUsers = await prisma.user.findMany({
        cacheStrategy: {
            swr: 60,
            ttl: 60
        }
    });
    console.log('All users:', allUsers);
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
