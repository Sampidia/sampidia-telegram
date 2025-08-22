import { NextRequest, NextResponse } from 'next/server';
const { PrismaClient } = require('@prisma/client');
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET(req: NextRequest) {
  try {
    const itemId = req.nextUrl.searchParams.get('itemId');
    const transactionId = req.nextUrl.searchParams.get('transactionId');

    if (!itemId || !transactionId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch purchase from the database
    const purchase = await prisma.payment.findFirst({
  where: { 
    itemId: itemId,
    transactionId: transactionId,
    status: 'COMPLETED'
  },
  cacheStrategy: {
    ttl: 60, // cache is fresh for 60 seconds
    swr: 60  // serve stale data for up to 60 seconds while revalidating
  }
});
    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Generate a secret based on the purchase (in a real app, this would be stored securely)
    const secret = `SECRET_${purchase.itemId}_${purchase.transactionId}_${Date.now()}`;

    return NextResponse.json({ secret });
  } catch (error) {
    console.error('Error retrieving secret:', error);
    return NextResponse.json({ error: 'Failed to retrieve secret' }, { status: 500 });
  }
} 