import { NextRequest, NextResponse } from "next/server";
import { Bot } from "grammy";

const bot = new Bot(process.env.BOT_TOKEN || "");

export async function POST(req: NextRequest) {
  try {
    const { webhookUrl } = await req.json();
    
    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 });
    }

    // Set the webhook
    await bot.api.setWebhook(webhookUrl, {
      allowed_updates: ["message", "pre_checkout_query"]
    });

    // Get webhook info to verify
    const webhookInfo = await bot.api.getWebhookInfo();

    return NextResponse.json({ 
      success: true, 
      webhookInfo: webhookInfo 
    });
  } catch (error) {
    console.error('Error setting webhook:', error);
    return NextResponse.json({ error: 'Failed to set webhook' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const webhookInfo = await bot.api.getWebhookInfo();
    return NextResponse.json({ webhookInfo });
  } catch (error) {
    console.error('Error getting webhook info:', error);
    return NextResponse.json({ error: 'Failed to get webhook info' }, { status: 500 });
  }
}
