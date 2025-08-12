import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service Role key ONLY on server side
);

export async function POST(request: NextRequest) {
  const { userId, price } = await request.json();

  if (!userId || typeof price !== "number") {
    return NextResponse.json({ error: "Missing userId or price" }, { status: 400 });
  }

  // Fetch current balance
  const { data, error: fetchError } = await supabase
    .from("purchases")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const currentBalance = data?.balance || 0;
  const newBalance = currentBalance + price;

  // Update balance
  const { error: updateError } = await supabase
    .from("purchases")
    .update({ balance: newBalance })
    .eq("user_id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ balance: newBalance });
}
