import { NextResponse } from "next/server";
import { Bot } from "grammy";
// Create bot instance for testing
const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
const bot = new Bot(botToken);
export async function GET(req) {
    try {
        console.log('Testing bot configuration...');
        console.log('Bot token:', botToken ? 'Set' : 'Not set');
        // Test bot info
        const botInfo = await bot.api.getMe();
        console.log('Bot info:', botInfo);
        // Test creating a simple invoice link
        const testInvoiceLink = await bot.api.createInvoiceLink("Test Product", "Test description", JSON.stringify({ test: true }), "", // Provider token empty for Telegram Stars
        "XTR", // Currency for Telegram Stars
        [{ amount: 1, label: "Test Product" }]);
        console.log('Test invoice link created:', testInvoiceLink);
        return NextResponse.json({
            success: true,
            botInfo,
            testInvoiceLink,
            message: 'Bot is properly configured for Telegram Stars payments'
        });
    }
    catch (error) {
        console.error('Bot test failed:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
            name: error instanceof Error ? error.name : 'Unknown error type'
        });
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Bot configuration test failed'
        }, { status: 500 });
    }
}
