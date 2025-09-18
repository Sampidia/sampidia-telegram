// app/api/create-invoice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Bot } from "grammy";

// Create bot instance for creating invoice links
const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
const bot = new Bot(botToken);

export async function POST(req: NextRequest) {
  try {
    const { itemId, userId, customAmount, customPrice } = await req.json();

    let payload: any;
    let title: string;
    let description: string;
    let priceLabel: string;
    let priceAmount: number;

    if (customAmount && customPrice) {
      // Custom amount purchase
      const amount = parseInt(customAmount);
      if (isNaN(amount) || amount < 1 || amount > 30000) {
        return NextResponse.json({ error: 'Custom amount must be between 1 and 30,000' }, { status: 400 });
      }

      payload = JSON.stringify({
        customAmount: amount,
        customPrice: customPrice,
        userId: userId,
        paymentType: 'custom'
      });

      title = `${amount.toLocaleString()} Stars Custom Purchase`;
      description = `Purchase ${amount.toLocaleString()} stars - Custom amount`;
      priceLabel = `${amount.toLocaleString()} Stars`;
      priceAmount = customPrice;
    } else {
      // Regular item purchase
      if (!itemId) {
        return NextResponse.json({ error: 'itemId is required for regular purchases' }, { status: 400 });
      }

      // Get item details from the items data
      const { ITEMS } = await import('@/app/data/items');
      const item = ITEMS.find((i: any) => i.id === itemId);

      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      // Prepare payload for the payment
      payload = JSON.stringify({
        itemId: item.id,
        userId: userId,
        paymentType: 'regular'
      });

      title = item.name;
      description = item.description;
      priceLabel = item.name;
      priceAmount = item.price;
    }

    // Create invoice link using Telegram's createInvoiceLink method
    const invoiceLink = await bot.api.createInvoiceLink(
      title,
      description,
      payload,
      "", // Provider token must be empty for Telegram Stars
      "XTR", // Currency for Telegram Stars
      [{ amount: priceAmount, label: priceLabel }]
    );

    // Build the response data based on purchase type
    let responseData: any = {
      invoiceLink: invoiceLink,
      paymentType: 'telegram_stars'
    };

    if (customAmount && customPrice) {
      responseData.customAmount = customAmount;
      responseData.customPrice = customPrice;
    } else {
      const { ITEMS } = await import('@/app/data/items');
      responseData.item = ITEMS.find((i: any) => i.id === itemId);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error creating invoice link:', error);
    return NextResponse.json({ error: 'Failed to create invoice link' }, { status: 500 });
  }
}
