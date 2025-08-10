import { NextRequest, NextResponse } from 'next/server';
import { getItemById } from '@/app/data/items';
import { Purchase } from '@/app/types';

// Simulated storage for purchases - in a real app, this would be a database

// Using the same in-memory storage reference 
// @ts-ignore - This is a demo, in a real app we would use a proper data store
if (!global.purchases) {
  // @ts-ignore
  global.purchases = [];
}

// @ts-ignore
const purchases = global.purchases;

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // Filter purchases by userId
    const userPurchases = purchases.filter((purchase: Purchase) => purchase.userId === userId);
    
    // Validate all items in purchases exist (in case item data has changed)
    const validatedPurchases = userPurchases.filter((purchase: Purchase) => {
      return getItemById(purchase.itemId) !== undefined;
    });
    
    return NextResponse.json({ purchases: validatedPurchases });
  } catch (error) {
    console.error('Error retrieving purchases:', error);
    return NextResponse.json({ error: 'Failed to retrieve purchases' }, { status: 500 });
  }
} 