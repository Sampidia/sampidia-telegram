import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // For this demo app, we're directing users to use the bot for refunds
  // since we don't have a real database with transaction IDs
  return NextResponse.json({ 
    success: false,
    message: 'In this demo app, refunds must be handled through the Telegram Bot',
    details: 'For a production app, you would implement direct refund functionality using real transaction IDs stored in your database.'
  }, { status: 400 });
} 