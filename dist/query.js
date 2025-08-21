import prisma from '@/lib/prisma';
const users = await prisma.user.findMany({
    where: {
        firstName: { endsWith: "prisma.io" }
    },
});
