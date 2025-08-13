import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

interface InvoiceItem {
  name: string;
  description: string;
  price: number;
}

interface TelegramInvoiceResponse {
  ok: boolean;
  result?: string;
  description?: string;
}

const BOT_TOKEN = process.env.BOT_TOKEN!;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);


if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are missing.');
}

async function createInvoiceLink(
  item: InvoiceItem,
  requestId: string,
  BOT_TOKEN: string
): Promise<TelegramInvoiceResponse> {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: item.name,
      description: item.description,
      payload: JSON.stringify({ requestId }),
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: item.name, amount: item.price }],
      start_parameter: 'start_parameter'
    })
  });

  const responseData: TelegramInvoiceResponse = await response.json();

  const { error } = await supabase
    .from('purchases')
    .insert([
      {
        name: item.name,
        description: item.description,
        price: item.price,
      
      }
    ]);

  if (error) {
    console.error('Error inserting data:', error);
    throw error;
  }

  return responseData;
}

// ✅ Export only HTTP method
export async function POST(req: NextRequest) {
  try {
    const { name, description, price } = await req.json();

    if (!name || !description || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const requestId = uuidv4();
    const invoice = await createInvoiceLink({ name, description, price }, requestId, BOT_TOKEN!);

    return NextResponse.json(invoice);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
