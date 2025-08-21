import express from "express";
import { Bot, webhookCallback } from "grammy";
import { PrismaClient } from '@prisma/client';
const app = express();
const port = 3001;
const prisma = new PrismaClient();
app.use(express.json());
// Create an instance of the `Bot` class and pass your bot token to it.
const bot = new Bot(process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "");
/*
  Handles the /start command.
  Sends a welcome message to the user and explains the available commands for interacting with the bot.
*/
bot.command("start", async (ctx) => {
    const startParam = ctx.match;
    // Handle payment commands from web app
    if (startParam && startParam.startsWith('pay_')) {
        const parts = startParam.split('_');
        if (parts.length >= 3) {
            const [, , itemId, userId] = parts;
            await handlePaymentRequest(ctx, itemId, userId);
            return;
        }
    }
    // Regular start command
    ctx.reply(`Welcome to SamPidia! 🌟 I am a bot that can accept payments via Telegram Stars. The following commands are available:

/send1 - Purchase 1 Star for ₦1
/send25 - Purchase 25 Stars for ₦450
/send50 - Purchase 50 Stars for ₦900
/send100 - Purchase 100 Stars for ₦1,800
/send500 - Purchase 500 Stars for ₦9,000
/send1000 - Purchase 1000 Stars for ₦18,000
/balance - Check your current balance
/withdraw - Withdraw your balance
/refund - Request a refund for a purchase
`);
});
// Handle payment requests from web app
async function handlePaymentRequest(ctx, itemId, userId) {
    try {
        // Get item details
        const { ITEMS } = await import('./app/data/items');
        const item = ITEMS.find(i => i.id === itemId);
        if (!item) {
            await ctx.reply('❌ Item not found. Please try again.');
            return;
        }
        // Create Telegram Stars payment
        const payment = await ctx.replyWithInvoice(item.name, item.description, JSON.stringify({
            itemId: item.id,
            userId: userId
        }), "", // Provider token (empty for Telegram Stars)
        "XTR", // Currency for Telegram Stars
        [{ amount: item.price, label: item.name }]);
        console.log('Payment invoice created:', payment);
    }
    catch (error) {
        console.error('Error creating payment:', error);
        await ctx.reply('❌ Failed to create payment. Please try again.');
    }
}
// Helper function to create invoice for direct commands
const createInvoice = (ctx, itemName, itemDescription, amount) => {
    var _a;
    return ctx.replyWithInvoice(itemName, itemDescription, JSON.stringify({
        itemId: itemName.toLowerCase().replace(/\s+/g, ''),
        userId: (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id
    }), "", // Provider token (empty for Telegram Stars)
    "XTR", // Currency for Telegram Stars
    [{ amount: amount, label: itemName }]);
};
// Star purchase commands
bot.command("send1", (ctx) => createInvoice(ctx, "1 Star ✨", "₦1", 1));
bot.command("send25", (ctx) => createInvoice(ctx, "25 Stars 🌟", "₦450", 25));
bot.command("send50", (ctx) => createInvoice(ctx, "50 Stars ⭐", "₦900", 50));
bot.command("send100", (ctx) => createInvoice(ctx, "100 Stars ⭐", "₦1,800", 100));
bot.command("send500", (ctx) => createInvoice(ctx, "500 Stars ⭐", "₦9,000", 500));
bot.command("send1000", (ctx) => createInvoice(ctx, "1000 Stars ⭐", "₦18,000", 1000));
/*
  Handles the pre_checkout_query event.
  Telegram sends this event to the bot when a user clicks the payment button.
  The bot must respond with answerPreCheckoutQuery within 10 seconds to confirm or cancel the transaction.
*/
bot.on("pre_checkout_query", (ctx) => {
    return ctx.answerPreCheckoutQuery(true).catch(() => {
        console.error("answerPreCheckoutQuery failed");
    });
});
/*
  Handles the message:successful_payment event.
  This event is triggered when a payment is successfully processed.
  Updates the database with payment details.
*/
bot.on("message:successful_payment", async (ctx) => {
    var _a;
    if (!ctx.message || !ctx.message.successful_payment || !ctx.from) {
        console.log('Missing payment data:', { message: !!ctx.message, payment: !!((_a = ctx.message) === null || _a === void 0 ? void 0 : _a.successful_payment), from: !!ctx.from });
        return;
    }
    try {
        const payment = ctx.message.successful_payment;
        console.log('Processing payment from Mini App:', payment);
        const payload = JSON.parse(payment.invoice_payload || '{}');
        console.log('Payment payload:', payload);
        // Validate required fields
        const userId = payload.userId || ctx.from.id.toString();
        const telegramId = ctx.from.id.toString();
        const transactionId = payment.telegram_payment_charge_id;
        const amount = payment.total_amount || 0;
        const itemId = payload.itemId || 'unknown';
        console.log('Payment data to save:', {
            userId,
            telegramId,
            transactionId,
            amount,
            itemId
        });
        // First, ensure user exists and get their ID
        const user = await prisma.user.upsert({
            where: { telegramId: telegramId },
            update: {
                balance: { increment: amount },
                lastSeenAt: new Date()
            },
            create: {
                telegramId: telegramId,
                balance: amount,
                lastSeenAt: new Date()
            }
        });
        console.log('User created/updated:', user);
        // Store payment in database using the user's ID
        const savedPayment = await prisma.payment.create({
            data: {
                userId: user.id, // Use the actual user ID from the database
                telegramId: telegramId,
                transactionId: transactionId,
                productName: amount ? `${amount} Stars` : 'Stars',
                itemId: itemId,
                amount: amount,
                status: "COMPLETED",
            },
        });
        console.log('Payment saved to database:', savedPayment);
        console.log('User balance updated:', user);
        console.log('Payment processed successfully from Mini App:', payment);
        // Send confirmation message to the user
        await ctx.reply(`✅ Payment successful! You've purchased ${amount} Stars. Your balance has been updated.`);
    }
    catch (error) {
        console.error('Error processing payment from Mini App:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
            name: error instanceof Error ? error.name : 'Unknown error type'
        });
        // Send a more user-friendly error message
        await ctx.reply(`✅ Payment received! We're processing your purchase and will update your balance shortly.`);
    }
});
/*
  Handles the /balance command.
  Shows the user's current balance.
*/
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
/*
  Handles the /withdraw command.
  Provides withdrawal instructions.
*/
bot.command("withdraw", (ctx) => {
    var _a;
    ctx.reply(`💳 To withdraw your Stars balance, please contact our support team with your withdrawal request.

Your Telegram ID: ${(_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id}
Current balance: Check with /balance command

We'll process your withdrawal within 24-48 hours.`);
});
/*
  Handles the /refund command.
  Provides refund instructions.
*/
bot.command("refund", (ctx) => {
    var _a;
    ctx.reply(`🔄 To request a refund, please provide:
    
1. Your Telegram ID: ${(_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id}
2. Transaction ID from your purchase
3. Reason for refund

Contact our support team and we'll process your refund within 24-48 hours.`);
});
// Webhook only (NO bot.start())
app.use("/webhook", webhookCallback(bot, "express"));
app.get("/", (req, res) => res.send("SamPidia Bot running with webhook"));
app.listen(port, async () => {
    console.log(`SamPidia Bot server running on port ${port}`);
    console.log(`Bot token: ${process.env.BOT_TOKEN ? 'Set' : 'Using default'}`);
    // Only set webhook if WEBHOOK_URL is provided
    if (process.env.WEBHOOK_URL) {
        try {
            await bot.api.setWebhook(process.env.WEBHOOK_URL);
            console.log("Webhook set successfully to:", process.env.WEBHOOK_URL);
        }
        catch (error) {
            console.error("Error setting webhook:", error);
        }
    }
    else {
        console.log("No WEBHOOK_URL provided, webhook not set");
    }
});
