import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, transactionId } = body;

    if (!userId || !transactionId) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields: userId and transactionId'
      }, { status: 400 });
    }

    // Verify the transaction exists and belongs to user
    const { data: purchase, error: findError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('telegram_payment_charge_id', transactionId)
      .eq('status', 'completed')
      .single();

    if (findError || !purchase) {
      return NextResponse.json({ 
        success: false,
        error: 'Transaction not found or already refunded'
      }, { status: 404 });
    }

    // Update status to refunded
    const { error: updateError } = await supabase
      .from('purchases')
      .update({ status: 'refunded' })
      .eq('transaction_id', transactionId);

    if (updateError) {
      return NextResponse.json({ 
        success: false,
        error: 'Failed to process refund'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Refund processed successfully'
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
