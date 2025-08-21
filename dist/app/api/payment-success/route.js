import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// use `prisma` in your application to read and write data in your DB
export async function POST(req) {
    try {
        const body = await req.json();
        const { userId, itemId, transactionId } = body;
        // Get item details to calculate amount
        const { ITEMS } = await import('@/app/data/items');
        const item = ITEMS.find(i => i.id === itemId);
        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }
        // Generate a secret code for the purchase
        const secret = `SECRET_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
        // Use a transaction to ensure atomicity
        await prisma.$transaction([
            prisma.payment.create({
                data: {
                    userId: String(userId),
                    telegramId: String(userId),
                    transactionId: String(transactionId),
                    productName: item.name,
                    itemId: String(itemId),
                    amount: item.price,
                    status: "COMPLETED",
                },
            }),
            prisma.user.upsert({
                where: { telegramId: String(userId) },
                update: {
                    balance: { increment: item.price },
                    lastSeenAt: new Date()
                },
                create: {
                    telegramId: String(userId),
                    balance: item.price,
                    lastSeenAt: new Date()
                }
            }),
        ]);
        return NextResponse.json({
            success: true,
            secret: secret,
            amount: item.price
        });
    }
    catch (error) {
        console.error("Error storing payment:", error);
        return NextResponse.json({ error: "Failed to store payment" }, { status: 500 });
    }
}
