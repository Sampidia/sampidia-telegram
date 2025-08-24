import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
  });
    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

   const secret = `SECRET_${purchase!.itemId}_${purchase!.transactionId}_${Date.now()}`;




    return NextResponse.json({ secret });
  } catch (error) {
    console.error('Error retrieving secret:', error);
    return NextResponse.json({ error: 'Failed to retrieve secret' }, { status: 500 });
  }
} 