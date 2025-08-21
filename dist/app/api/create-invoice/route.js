// app/api/generate-invoice/route.ts
import { NextResponse } from "next/server";
import { Bot } from "grammy";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// use `prisma` in your application to read and write data in your DB
const bot = new Bot(process.env.BOT_TOKEN);
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
        // Prepare Telegram invoice parameters
        const prices = [{ amount: item.price, label: item.name }];
        const payload = JSON.stringify({
            invoiceId: newInvoice.id,
            itemId: item.id,
            userId: userId
        });
        // Generate invoice link via Telegram Bot API
        const invoiceLink = await bot.api.createInvoiceLink(item.name, item.description, payload, "", // Provider token empty for Telegram Stars
        "XTR", // Currency for Telegram Stars
        prices);
        return NextResponse.json({
            invoiceLink,
            invoiceId: newInvoice.id,
            item: item
        });
    }
    catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }
}
