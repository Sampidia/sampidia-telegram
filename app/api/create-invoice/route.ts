import { NextRequest, NextResponse } from 'next/server';
import { getItemById } from '@/app/data/items';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface PaymentRequest {
  requestId: string;
  userId: string;
  itemId: string;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
  transactionId?: string;
  price: number;
}

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

    const requestId = uuidv4();
    const createdAt = new Date().toISOString();

    // Store payment request in Supabase
    const { error: dbError } = await supabase
      .from('payment_requests')
      .insert([{
        request_id: requestId,
        user_id: userId,
        item_id: itemId,
        status: 'pending',
        created_at: createdAt,
        price: item.price
      }]);

    if (dbError) {
      return NextResponse.json({ error: 'Failed to store payment request' }, { status: 500 });
    }

    // Get the BOT_TOKEN from environment variables
    const BOT_TOKEN = process.env.BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    // Create an actual invoice link by calling the Telegram Bot API
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: item.name,
        description: item.description,
        payload: JSON.stringify({ requestId }), // Include requestId in payload
        provider_token: '', // Empty for Telegram Stars payments
        currency: 'XTR',    // Telegram Stars currency code
        prices: [{ label: item.name, amount: item.price }],
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
