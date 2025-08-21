// app/api/create-invoice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Bot } from "grammy";

// Create bot instance for creating invoice links
const bot = new Bot(process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "");

export async function POST(req: NextRequest) {
  try {
    const { itemId, userId } = await req.json();
    
    // Get item details from the items data
    const { ITEMS } = await import('@/app/data/items');
    const item = ITEMS.find(i => i.id === itemId);
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Prepare payload for the payment
    const payload = JSON.stringify({ 
      itemId: item.id,
      userId: userId
    });

    // Create invoice link using Telegram's createInvoiceLink method
    const invoiceLink = await bot.api.createInvoiceLink(
      item.name,
      item.description,
      payload,
      "", // Provider token must be empty for Telegram Stars
      "XTR", // Currency for Telegram Stars
      [{ amount: item.price, label: item.name }]
    );

    return NextResponse.json({ 
      invoiceLink: invoiceLink,
      item: item,
      paymentType: 'telegram_stars'
    });
  } catch (error) {
    console.error('Error creating invoice link:', error);
    return NextResponse.json({ error: 'Failed to create invoice link' }, { status: 500 });
  }
}