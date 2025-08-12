import { NextRequest, NextResponse } from 'next/server';
import { getItemById } from '@/app/data/items';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' }, 
        { status: 400 }
      );
    }

    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve purchases' }, 
        { status: 500 }
      );
    }

    if (!purchases || purchases.length === 0) {
      return NextResponse.json(
        { purchases: [] }, 
        { status: 200 }
      );
    }

    const validatedPurchases = purchases
      .filter(purchase => {
        try {
          return !!getItemById(purchase.item_id);
        } catch {
          console.warn(`Invalid item found in purchases: ${purchase.item_id}`);
          return false;
        }
      })
      .map(purchase => ({
        userId: purchase.user_id,
        itemId: purchase.item_id,
        timestamp: new Date(purchase.timestamp).getTime(),
        transactionId: purchase.transaction_id,
      }));
    
    return NextResponse.json(
      { purchases: validatedPurchases },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error retrieving purchases:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}