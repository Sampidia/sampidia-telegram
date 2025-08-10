import { NextRequest, NextResponse } from 'next/server';
import { getSecretForItem } from '@/app/server/item-secrets';

// Make purchases accessible to other routes
// @ts-ignore - This is a demo, in a real app we would use a proper data store
if (!global.purchases) {
  // @ts-ignore
  global.purchases = [];
}

// @ts-ignore
const purchases = global.purchases;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, itemId, transactionId } = body;

    if (!userId || !itemId || !transactionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In a real application, you would verify the payment with Telegram
    // before storing it as successful

    // Get the secret code for this item
    const secret = getSecretForItem(itemId);
    
    if (!secret) {
      return NextResponse.json({ error: 'Secret not found for this item' }, { status: 404 });
    }

    // Store the purchase
    purchases.push({
      userId,
      itemId,
      timestamp: Date.now(),
      transactionId
    });

    // Return the secret to the client
    return NextResponse.json({ success: true, secret });
  } catch (error) {
    console.error('Error storing successful payment:', error);
    return NextResponse.json({ error: 'Failed to store payment data' }, { status: 500 });
  }
} 