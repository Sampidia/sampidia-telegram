import express from "express";
import { Bot, webhookCallback } from "grammy";
import { PrismaClient } from '@prisma/client';
const app = express();
const port = 3001;
const prisma = new PrismaClient();
app.use(express.json());
// Create an instance of the `Bot` class and pass your bot token to it.
const bot = new Bot(process.env.BOT_TOKEN || "7813322141:AAEqawGpmn0hfsImfQ3hlQqJQKSStvTMF6E");
/*
  Handles the /start command.
  Sends a welcome message to the user and explains the available commands for interacting with the bot.
*/
bot.command("start", async (ctx) => {
    const startParam = ctx.match;
    // Handle payment commands from web app
    if (startParam && startParam.startsWith('pay_')) {
        const parts = startParam.split('_');
        if (parts.length >= 4) {
            const [, , itemId, userId, invoiceId] = parts;
            await handlePaymentRequest(ctx, itemId, userId, invoiceId);
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
async function handlePaymentRequest(ctx, itemId, userId, invoiceId) {
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
            userId: userId,
            invoiceId: invoiceId
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
    if (!ctx.message || !ctx.message.successful_payment || !ctx.from) {
        return;
    }
    try {
        const payment = ctx.message.successful_payment;
        const payload = JSON.parse(payment.invoice_payload || '{}');
        // Store payment in database
        await prisma.payment.create({
            data: {
                userId: payload.userId || ctx.from.id.toString(),
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
                balance: payment.total_amount || 0,
                lastSeenAt: new Date()
            }
        });
        // Update invoice status if invoiceId is provided
        if (payload.invoiceId) {
            await prisma.invoice.update({
                where: { id: payload.invoiceId },
                data: { status: "PAID" }
            });
        }
        console.log('Payment processed successfully:', payment);
        // Send confirmation message
        await ctx.reply(`✅ Payment successful! You've purchased ${payment.total_amount} Stars. Your balance has been updated.`);
    }
    catch (error) {
        console.error('Error processing payment:', error);
        await ctx.reply('❌ There was an error processing your payment. Please contact support.');
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
