import { NextRequest, NextResponse } from 'next/server';
import { getSecretForItem } from '@/app/server/item-secrets';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, itemId, transactionId } = body;

    if (!userId || !itemId || !transactionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the secret code for this item
    const secret = getSecretForItem(itemId);
    
    if (!secret) {
      return NextResponse.json({ error: 'Secret not found for this item' }, { status: 404 });
    }

    // Store the purchase in Supabase
    const { error } = await supabase
      .from('purchases')
      .insert([{
        user_id: userId,
        item_id: itemId,
        timestamp: new Date().toISOString(),
        transaction_id: transactionId,
        status: 'completed'
      }]);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to store purchase' }, { status: 500 });
    }

    // Return the secret to the client
    return NextResponse.json({ success: true, secret });
  } catch (error) {
    console.error('Error storing successful payment:', error);
    return NextResponse.json({ error: 'Failed to store payment data' }, { status: 500 });
  }
}
