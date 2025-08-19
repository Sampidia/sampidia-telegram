import { NextRequest, NextResponse } from 'next/server';
import { getSecretForItem } from '@/app/server/item-secrets';
import { auth } from "@clerk/nextjs/server"; // Or your auth provider
import { PrismaClient } from '@prisma/client'


const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const itemId = req.nextUrl.searchParams.get('itemId');
    const transactionId = req.nextUrl.searchParams.get('transactionId');

    if (!itemId || !transactionId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Authenticate user (example with Clerk)
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch purchase from the database
    const purchase = await prisma.payment.findUnique({
      where: { itemid_transactionId: { itemId, transactionId } },
      select: { userId: true }
    });

    if (!purchase || purchase.userId !== userId) {
      return NextResponse.json({ error: 'Purchase not found or not authorized' }, { status: 404 });
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