import { NextResponse } from 'next/server';
export async function POST(req) {
    // For this demo app, we're directing users to use the bot for withdrawal
    // since we don't have a real database with transaction IDs
    return NextResponse.json({
        success: false,
        message: 'In SamPidia, withdraw must be handled through bank transfer or TON payment',
        details: 'For any complaint, message support and drop your userId and transcation Id stored in your database.'
    }, { status: 400 });
}
