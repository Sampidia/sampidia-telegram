import { PrismaClient } from 'app/generated-prisma-client';
import { withAccelerate } from '@prisma/extension-accelerate';
const prisma = new PrismaClient().$extends(withAccelerate());
export default async function Page({ params }) {
    const user = await prisma.user.findUnique({
        where: { telegramId: params.userTelegramId },
        select: { balance: true },
        cacheStrategy: {
            ttl: 60,
            swr: 60,
        },
    });
    return User;
    Balance < /h1>
        < p > Balance;
    {
        (user === null || user === void 0 ? void 0 : user.balance) || 0;
    }
    /p>
        < /div>;
    ;
}
