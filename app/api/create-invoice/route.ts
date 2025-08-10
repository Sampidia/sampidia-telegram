import { NextRequest, NextResponse } from 'next/server';
import { getItemById } from '@/app/data/items';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, itemId } = body;

    if (!userId || !itemId) {
      return NextResponse.json({ error: 'Missing required fields: userId and itemId' }, { status: 400 });
    }

    // Get item details from our data store
    const item = getItemById(itemId);
    if (!item) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    // Extract item details
    const { name: title, description, price } = item;

    // Get the BOT_TOKEN from environment variables
    const BOT_TOKEN = process.env.BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    // PRODUCTION IMPLEMENTATION:
    // In a real production app:
    // 1. Generate a unique ID for this payment request
    // const requestId = generateUniqueId();
    // 
    // 2. Store it in your database with the pending status
    // await db.paymentRequests.create({
    //   requestId,
    //   userId,
    //   itemId,
    //   status: 'pending',
    //   createdAt: Date.now()
    // });
    // 
    // 3. Include this ID in the invoice payload
    // const payload = JSON.stringify({ requestId });
    //
    // 4. Configure your bot's webhook to handle payment_successful updates
    // and update the database with the real telegram_payment_charge_id when payment is complete
    // 
    // 5. After the WebApp.openInvoice callback indicates 'paid', query your database 
    // using the requestId to get the real transaction ID for successful payments

    // Create an actual invoice link by calling the Telegram Bot API
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        payload: itemId, // In production, use a JSON string with a unique request ID
        provider_token: '', // Empty for Telegram Stars payments
        currency: 'XTR',    // Telegram Stars currency code
        prices: [{ label: title, amount: price }],
        start_parameter: "start_parameter" // Required for some clients
      })
    });

    const data = await response.json();
    
    if (!data.ok) {
      console.error('Telegram API error:', data);
      return NextResponse.json({ error: data.description || 'Failed to create invoice' }, { status: 500 });
    }
    
    const invoiceLink = data.result;

    // We don't store the purchase yet - that will happen after successful payment
    // We'll return the invoice link to the frontend
    return NextResponse.json({ invoiceLink });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
} 