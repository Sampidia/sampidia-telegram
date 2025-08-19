import asyncio
from prisma import Prisma
from prisma.models import User

async def main() -> None:
    db = Prisma(auto_register=True)
    await db.connect()

    # write your queries here
    user = await User.prisma().create(
        data={
            'name': 'Robert 33fe',
            'email': 'robert3rer3@craigie.dev'
        },
    )

    await db.disconnect()

if __name__ == '__main__':
    asyncio.run(main())