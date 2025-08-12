// app/api/saveUser/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { UserData } from '@/types/user';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service key for secure writes
);

export async function POST(req: Request) {
  try {
    const user: UserData = await req.json();

    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        language_code: user.language_code || '',
        is_premium: user.is_premium,
      });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
