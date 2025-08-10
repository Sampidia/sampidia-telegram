import { NextRequest, NextResponse } from 'next/server';
import { getSecretForItem } from '@/app/server/item-secrets';

// Get reference to the purchases from the global store
// @ts-ignore - This is a demo, in a real app we would use a proper data store
if (!global.purchases) {
  // @ts-ignore
  global.purchases = [];
}

// @ts-ignore
const purchases = global.purchases;

export async function GET(req: NextRequest) {
  try {
    const itemId = req.nextUrl.searchParams.get('itemId');
    const transactionId = req.nextUrl.searchParams.get('transactionId');

    if (!itemId || !transactionId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify the purchase exists
    const purchase = purchases.find((p: any) => 
      p.itemId === itemId && p.transactionId === transactionId
    );

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Get the secret for the purchased item
    const secret = getSecretForItem(itemId);
    
    if (!secret) {
      return NextResponse.json({ error: 'Secret not found for this item' }, { status: 404 });
    }

    return NextResponse.json({ secret });
  } catch (error) {
    console.error('Error retrieving secret:', error);
    return NextResponse.json({ error: 'Failed to retrieve secret' }, { status: 500 });
  }
} 