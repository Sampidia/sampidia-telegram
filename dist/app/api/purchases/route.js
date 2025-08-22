import { NextResponse } from 'next/server';
import { getItemById } from '@/app/data/items';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function GET(req) {
    try {
        const userId = req.nextUrl.searchParams.get('userId');
        if (!userId) {
            // Return empty purchases instead of error to prevent app freezing
            return NextResponse.json({
                success: true,
                purchases: []
            });
        }
        // Try to connect to database and get purchases
        try {
            // Filter purchases by userId from database
            const userPurchases = await prisma.payment.findMany({
                where: {
                    userId: userId,
                    status: 'COMPLETED'
                },
                orderBy: {
                    createdAt: 'desc'
                },
            });
            // Validate all items in purchases exist (in case item data has changed)
            const validatedPurchases = userPurchases.map((purchase) => {
                const item = getItemById(purchase.itemId);
                return item ? purchase : null;
            });
            // Filter out null values (purchases with invalid items)
            const filteredPurchases = validatedPurchases.filter((purchase) => purchase !== null);
            return NextResponse.json({
                success: true,
                purchases: filteredPurchases
            });
        }
        catch (dbError) {
            console.error('Database error:', dbError);
            // Return empty purchases instead of error to prevent app freezing
            return NextResponse.json({
                success: true,
                purchases: []
            });
        }
    }
    catch (error) {
        console.error('Error retrieving purchases:', error);
        // Return empty purchases instead of error to prevent app freezing
        return NextResponse.json({
            success: true,
            purchases: []
        });
    }
}
