import { NextRequest, NextResponse } from 'next/server';
import { getSecretForItem } from '@/app/server/item-secrets';
import { supabase } from '@/lib/supabase';

// This API route needs to be dynamic
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const itemId = req.nextUrl.searchParams.get('itemId');
    const transactionId = req.nextUrl.searchParams.get('transactionId');

    if (!itemId || !transactionId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const { data: purchase, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('item_id', itemId)
      .eq('transaction_id', transactionId)
      .single();

    if (error || !purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    const secret = getSecretForItem(itemId);
    if (!secret) {
      return NextResponse.json(
        { error: 'Secret not found for this item' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      secret,
      itemId: purchase.item_id,
      transactionId: purchase.transaction_id,
      purchasedAt: purchase.timestamp
    });

  } catch (error) {
    console.error('Error retrieving secret:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}