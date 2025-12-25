import { Bot, Context } from "grammy";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function setupBot(bot: Bot) {
    // Handle the /start command.
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
        await ctx.reply(
            `Welcome to SamPidia! 🌟 I am a bot that can accept payments via Telegram Stars. The following commands are available:

/send1 - Sell 1 Star for $0.009
/send25 - Sell 25 Stars for $0.225
/send50 - Sell 50 Stars for $0.45
/send100 - Sell 100 Stars for $0.9
/send500 - Sell 500 Stars for $4.5
/send1000 - Sell 1000 Stars for $9
/balance - Check your current balance
/withdraw - Withdraw your balance
/refund - Request a refund for a purchase
`,
        );
    });

    // Star purchase commands
    bot.command("send1", (ctx) => createInvoice(ctx, "1 Star ✨", "$0.009", 1));
    bot.command("send25", (ctx) => createInvoice(ctx, "25 Stars 🌟", "$0.225", 25));
    bot.command("send50", (ctx) => createInvoice(ctx, "50 Stars ⭐", "$0.45", 50));
    bot.command("send100", (ctx) => createInvoice(ctx, "100 Stars ⭐", "$0.9", 100));
    bot.command("send500", (ctx) => createInvoice(ctx, "500 Stars ⭐", "$4.5", 500));
    bot.command("send1000", (ctx) => createInvoice(ctx, "1000 Stars ⭐", "$9", 1000));

    // Handle the /balance command.
    bot.command("balance", async (ctx) => {
        try {
            if (!ctx.from?.id) {
                await ctx.reply('❌ Unable to identify your Telegram ID.');
                return;
            }

            const telegramId = ctx.from.id.toString();
            const user = await prisma.user.findUnique({
                where: { telegramId },
            });

            const balance = user?.balance || 0;
            await ctx.reply(`💰 Your current balance: ${balance} Stars`);
        } catch (error) {
            console.error('Error fetching balance:', error);
            await ctx.reply('❌ Error fetching your balance.');
        }
    });

    // Support commands
    bot.command("withdraw", (ctx) => {
        ctx.reply(
            `💳 To withdraw your Stars balance, please contact our support team with your withdrawal request.

Your Telegram ID: ${ctx.from?.id}
Current balance: Check with /balance command

We'll process your withdrawal within 24-48 hours.`
        );
    });

    bot.command("refund", (ctx) => {
        ctx.reply(
            `🔄 To request a refund, please provide:
      
1. Your Telegram ID: ${ctx.from?.id}
2. Transaction ID from your purchase
3. Reason for refund

Contact our support team and we'll process your refund within 24-48 hours.`
        );
    });

    // Pre-checkout query handler
    bot.on("pre_checkout_query", (ctx) => {
        return ctx.answerPreCheckoutQuery(true).catch((error) => {
            console.error("answerPreCheckoutQuery failed:", error);
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
            const telegramId = ctx.from.id.toString();
            const amount = payment.total_amount || 0;

            console.log(`Processing payment for user ${telegramId}, amount: ${amount}`);

            const existingPayment = await prisma.payment.findUnique({
                where: { transactionId: payment.telegram_payment_charge_id }
            });

            if (existingPayment) {
                await ctx.reply(`✅ Payment successful! You've purchased ${amount} Stars. Your balance has been updated.`);
                return;
            }

            const user = await prisma.user.upsert({
                where: { telegramId: telegramId },
                update: {
                    balance: { increment: amount },
                    lastSeenAt: new Date()
                },
                create: {
                    telegramId: telegramId,
                    firstName: ctx.from.first_name || '',
                    username: ctx.from.username || '',
                    balance: amount,
                    lastSeenAt: new Date()
                }
            });

            await prisma.payment.create({
                data: {
                    userId: user.id,
                    telegramId: telegramId,
                    transactionId: payment.telegram_payment_charge_id,
                    productName: amount ? `${amount} Stars` : 'Stars',
                    itemId: payload.itemId || 'unknown',
                    amount: amount,
                    status: "COMPLETED",
                },
            });

            await ctx.reply(`✅ Payment successful! You've purchased ${amount} Stars. Your balance has been updated.`);
        } catch (error) {
            console.error('Error processing payment:', error);
            await ctx.reply(`✅ Payment received! We're processing your purchase and will update your balance shortly.`);
        }
    });
}

// Helper functions
async function handlePaymentRequest(ctx: any, itemId: string, userId: string) {
    try {
        const { ITEMS } = await import('../app/data/items');
        const item = ITEMS.find(i => i.id === itemId);

        if (!item) {
            await ctx.reply('❌ Item not found. Please try again.');
            return;
        }

        await ctx.replyWithInvoice(
            item.name,
            item.description,
            JSON.stringify({ itemId: item.id, userId: userId }),
            "XTR", // Telegram Stars currency
            [{ amount: item.price, label: item.name }]
        );
    } catch (error) {
        console.error('Error creating payment:', error);
        await ctx.reply('❌ Failed to create payment. Please try again.');
    }
}

function createInvoice(ctx: any, itemName: string, itemDescription: string, amount: number) {
    return ctx.replyWithInvoice(
        itemName,
        itemDescription,
        JSON.stringify({
            itemId: itemName.toLowerCase().replace(/\s+/g, ''),
            userId: ctx.from?.id
        }),
        "XTR",
        [{ amount: amount, label: itemName }],
    );
}
