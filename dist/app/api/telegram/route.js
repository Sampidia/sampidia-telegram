import { NextResponse } from "next/server";
import { Bot, webhookCallback } from "grammy";
import prisma from '@/lib/prisma';
// Initialize the bot with your token
const bot = new Bot(process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "");
// Command handlers
bot.command("start", (ctx) => ctx.reply(`Welcome to SamPidia! 🌟 I am a bot that can accept payments via Telegram Stars. The following commands are available:

/send1 - Sell 1 Star for $0.008
/send25 - Sell 25 Stars for $0.2
/send50 - Sell 50 Stars for $0.4
/send100 - Sell 100 Stars for $0.8
/send500 - Sell 500 Stars for $4
/send1000 - Sell 1000 Stars for $8
/balance - Check your current balance
/withdraw - Withdraw your balance
/refund - Request a refund for a purchase
`));
// Helper function to create invoice
const createInvoice = (ctx, itemName, itemDescription, amount) => {
    var _a;
    return ctx.replyWithInvoice(itemName, itemDescription, JSON.stringify({
        itemId: itemName.toLowerCase().replace(/\s+/g, ''),
        userId: (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id
    }), "XTR", // Currency for Telegram Stars
    [{ amount: amount, label: itemName }]);
};
// Star purchase commands
bot.command("send1", (ctx) => createInvoice(ctx, "1 Star ✨", "$0.008", 1));
bot.command("send25", (ctx) => createInvoice(ctx, "25 Stars 🌟", "$0.2", 25));
bot.command("send50", (ctx) => createInvoice(ctx, "50 Stars ⭐", "$0.4", 50));
bot.command("send100", (ctx) => createInvoice(ctx, "100 Stars ⭐", "$0.8", 100));
bot.command("send500", (ctx) => createInvoice(ctx, "500 Stars ⭐", "$4", 500));
bot.command("send1000", (ctx) => createInvoice(ctx, "1000 Stars ⭐", "$8", 1000));
// Pre-checkout query handler
bot.on("pre_checkout_query", (ctx) => {
    return ctx.answerPreCheckoutQuery(true).catch(() => {
        console.error("answerPreCheckoutQuery failed");
    });
});
// Successful payment handler
bot.on("message:successful_payment", async (ctx) => {
    if (!ctx.message || !ctx.message.successful_payment || !ctx.from) {
        return;
    }
    try {
        const payment = ctx.message.successful_payment;
        const payload = JSON.parse(payment.invoice_payload || '{}');
        // Store payment in database
        await prisma.payment.create({
            data: {
                userId: ctx.from.id.toString(),
                telegramId: ctx.from.id.toString(),
                transactionId: payment.telegram_payment_charge_id,
                productName: payment.total_amount ? `${payment.total_amount} Stars` : 'Stars',
                itemId: payload.itemId || 'unknown',
                amount: payment.total_amount || 0,
                status: "COMPLETED",
            },
        });
        // Update user balance
        await prisma.user.upsert({
            where: { telegramId: ctx.from.id.toString() },
            update: {
                balance: { increment: payment.total_amount || 0 },
                lastSeenAt: new Date()
            },
            create: {
                telegramId: ctx.from.id.toString(),
                firstName: ctx.from.first_name || '',
                username: ctx.from.username || '',
                balance: payment.total_amount || 0,
                lastSeenAt: new Date()
            }
        });
        console.log('Payment processed successfully:', payment);
        // Send confirmation message
        await ctx.reply(`✅ Payment successful! You've purchased ${payment.total_amount} Stars. Your balance has been updated.`);
    }
    catch (error) {
        console.error('Error processing payment:', error);
        await ctx.reply(`✅ Payment received! We're processing your purchase and will update your balance shortly.`);
    }
});
// Balance command
bot.command("balance", async (ctx) => {
    var _a;
    try {
        const user = await prisma.user.findUnique({
            where: { telegramId: (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id.toString() }
        });
        const balance = (user === null || user === void 0 ? void 0 : user.balance) || 0;
        await ctx.reply(`💰 Your current balance: ${balance} Stars`);
    }
    catch (error) {
        console.error('Error fetching balance:', error);
        await ctx.reply('❌ Error fetching your balance. Please try again.');
    }
});
// Withdraw command
bot.command("withdraw", (ctx) => {
    var _a;
    ctx.reply(`💳 To withdraw your Stars balance, please contact our support team with your withdrawal request.

Your Telegram ID: ${(_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id}
Current balance: Check with /balance command

We'll process your withdrawal within 24-48 hours.`);
});
// Refund command
bot.command("refund", (ctx) => {
    var _a;
    ctx.reply(`🔄 To request a refund, please provide:
    
1. Your Telegram ID: ${(_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id}
2. Transaction ID from your purchase
3. Reason for refund

Contact our support team and we'll process your refund within 24-48 hours.`);
});
// Create webhook handler for Next.js
const handler = webhookCallback(bot, "next-js");
export async function POST(req) {
    try {
        const body = await req.json();
        const headers = Object.fromEntries(req.headers.entries());
        let responseStatus = 200;
        let responseBody = {};
        const mockRes = {
            end: (cb) => { if (cb)
                cb(); },
            status: (code) => { responseStatus = code; return mockRes; },
            json: (json) => { responseBody = json; return mockRes; },
            send: (json) => { responseBody = json; return mockRes; },
        };
        await handler({ body, headers }, mockRes);
        return NextResponse.json(responseBody, { status: responseStatus });
    }
    catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
// Health check route
export async function GET() {
    return NextResponse.json({
        status: "ok",
        message: "SamPidia Telegram Bot is running on Vercel 🚀",
        timestamp: new Date().toISOString()
    });
}
