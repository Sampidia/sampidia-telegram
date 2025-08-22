import { NextRequest, NextResponse } from "next/server";
const { PrismaClient } = require('@prisma/client');
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());


export async function POST(req: NextRequest) {
  try {
    const { telegramId, firstName, username } = await req.json();

    if (!telegramId) {
      return NextResponse.json({ error: "telegramId is required" }, { status: 400 });
    }

    // Use upsert to create the user if they don't exist, or update if they do
    const user = await prisma.user.upsert({
      where: { telegramId: String(telegramId) },
      update: {
        firstName: firstName || '',
        username: username || '',
        lastSeenAt: new Date(),
      },
      create: {
        telegramId: String(telegramId),
        firstName: firstName || '',
        username: username || '',
        balance: 0, // Initialize balance for new users
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({ user, message: "User created or updated" });
  } catch (error) {
    console.error("Error in user API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
