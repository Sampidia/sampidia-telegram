// app/api/create-invoice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Bot } from "grammy";

// Create bot instance for creating invoice links
const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
const bot = new Bot(botToken);

export async function POST(req: NextRequest) {
  try {
    const { itemId, userId } = await req.json();
    
    console.log('Creating invoice for:', { itemId, userId });
    
    // Get item details from the items data
    const { ITEMS } = await import('@/app/data/items');
    const item = ITEMS.find(i => i.id === itemId);
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    console.log('Item found:', item);

    // Prepare payload for the payment
    const payload = JSON.stringify({ 
      itemId: item.id,
      userId: userId
    });

    console.log('Creating invoice link with:', {
      title: item.name,
      description: item.description,
      payload,
      currency: "XTR",
      prices: [{ amount: item.price, label: item.name }]
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

    console.log('Invoice link created successfully:', invoiceLink);

    return NextResponse.json({ 
      invoiceLink: invoiceLink,
      item: item,
      paymentType: 'telegram_stars'
    });
  } catch (error) {
    console.error('Error creating invoice link:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type',
      botToken: botToken ? 'Set' : 'Not set'
    });
    return NextResponse.json({ error: 'Failed to create invoice link' }, { status: 500 });
  }
}