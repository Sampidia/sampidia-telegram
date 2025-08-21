// app/api/create-invoice/route.ts
import { NextResponse } from "next/server";
import { Bot } from "grammy";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// use `prisma` in your application to read and write data in your DB
// Use the bot token with fallback
const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "7813322141:AAEqawGpmn0hfsImfQ3hlQqJQKSStvTMF6E";
const bot = new Bot(botToken);
export async function POST(req) {
    try {
        const { itemId, userId } = await req.json();
        // Get item details from the items data
        const { ITEMS } = await import('@/app/data/items');
        const item = ITEMS.find(i => i.id === itemId);
        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }
        // Create invoice in DB
        const newInvoice = await prisma.invoice.create({
            data: {
                userId,
                title: item.name,
                description: item.description,
                currency: "XTR", // Telegram Stars currency
                amount: item.price,
                status: "PENDING",
            },
        });
        // For Telegram Stars, we create a payment URL that opens the bot
        // The bot will handle the actual payment creation
        const botUsername = process.env.BOT_USERNAME || 'SamPidiaBot';
        const paymentUrl = `https://t.me/${botUsername}?start=pay_${item.id}_${userId}_${newInvoice.id}`;
        return NextResponse.json({
            invoiceLink: paymentUrl,
            invoiceId: newInvoice.id,
            item: item,
            paymentType: 'telegram_stars'
        });
    }
    catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }
}
