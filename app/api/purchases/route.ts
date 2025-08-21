import { NextRequest, NextResponse } from 'next/server';
import { getItemById } from '@/app/data/items';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
// use `prisma` in your application to read and write data in your DB

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // Filter purchases by userId from database
    const userPurchases = await prisma.payment.findMany({
      where: {
        userId: userId,
        // Optionally filter by status if you only want completed purchases
        status: 'COMPLETED'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Validate all items in purchases exist (in case item data has changed)
    const validatedPurchases = userPurchases.map((purchase: any) => {
      const item = getItemById(purchase.itemId);
      return item ? purchase : null;
    });
    
    // Filter out null values (purchases with invalid items)
    const filteredPurchases = validatedPurchases.filter((purchase: any) => purchase !== null);
    
    return NextResponse.json({ 
      success: true,
      purchases: filteredPurchases 
    });
  } catch (error) {
    console.error('Error retrieving purchases:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to retrieve purchases' 
    }, { status: 500 });
  }
}
