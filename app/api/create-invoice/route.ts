// app/api/create-invoice/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { itemId, userId } = await req.json();
    
    // Get item details from the items data
    const { ITEMS } = await import('@/app/data/items');
    const item = ITEMS.find(i => i.id === itemId);
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Create a payment URL that opens the bot
    // The bot will handle the actual invoice creation and payment processing
    const botUsername = process.env.BOT_USERNAME || 'SamPidiaBot';
    const paymentUrl = `https://t.me/${botUsername}?start=pay_${item.id}_${userId}`;

    return NextResponse.json({ 
      invoiceLink: paymentUrl, 
      item: item,
      paymentType: 'telegram_stars'
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
  }
}