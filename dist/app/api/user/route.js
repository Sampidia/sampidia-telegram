import { NextResponse } from "next/server";
const { PrismaClient } = require('@prisma/client');
import { withAccelerate } from '@prisma/extension-accelerate';
const prisma = new PrismaClient().$extends(withAccelerate());
export async function POST(req) {
    try {
        const { telegramId, firstName, username } = await req.json();
        if (!telegramId) {
            return NextResponse.json({ error: "telegramId is required" }, { status: 400 });
        }
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { telegramId: String(telegramId) },
            cacheStrategy: {
                ttl: 60, // cache is fresh for 60 seconds
                swr: 60 // serve stale data for up to 60 seconds while revalidating
            }
        });
        if (existingUser) {
            return NextResponse.json({ user: existingUser, message: "User already exists" });
        }
        else {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
    }
    catch (error) {
        console.error("Error in user API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
