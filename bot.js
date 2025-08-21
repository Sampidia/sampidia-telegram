const express = require("express");
const { Bot, webhookCallback } = require("grammy");
const { PrismaClient } = require('@prisma/client');

const app = express();
const port = 3000;
const prisma = new PrismaClient();

app.use(express.json());

// Create an instance of the `Bot` class and pass your bot token to it.
const bot = new Bot(process.env.BOT_TOKEN || "7813322141:AAEqawGpmn0hfsImfQ3hlQqJQKSStvTMF6E");
// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.
/*
  Handles the /start command.
  Sends a welcome message to the user and explains the available commands for interacting with the bot.
*/
bot.command("start", (ctx) =>
  ctx.reply(
    `Welcome to SamPidia! 🌟 I am a bot that can accept payments via Telegram Stars. The following commands are available:

/send1 - Purchase 1 Star for ₦1
/send25 - Purchase 25 Stars for ₦450
/send50 - Purchase 50 Stars for ₦900
/send100 - Purchase 100 Stars for ₦1,800
/send500 - Purchase 500 Stars for ₦9,000
/send1000 - Purchase 1000 Stars for ₦18,000
/balance - Check your current balance
/withdraw - Withdraw your balance
/refund - Request a refund for a purchase
`
  )
);

// Helper function to create invoice
const createInvoice = (ctx, itemName, itemDescription, amount) => {
  return ctx.replyWithInvoice(
    itemName,
    itemDescription,
    JSON.stringify({ 
      itemId: itemName.toLowerCase().replace(/\s+/g, ''),
      userId: ctx.from?.id 
    }),
    "XTR", // Currency for Telegram Stars
    [{ amount: amount, label: itemName }],
  );
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
        balance: payment.total_amount || 0,
        lastSeenAt: new Date()
      }
    });

    console.log('Payment processed successfully:', payment);
    
    // Send confirmation message
    await ctx.reply(`✅ Payment successful! You've purchased ${payment.total_amount} Stars. Your balance has been updated.`);
  } catch (error) {
    console.error('Error processing payment:', error);
    await ctx.reply('❌ There was an error processing your payment. Please contact support.');
  }
});

/*
  Handles the /balance command.
  Shows the user's current balance.
*/
bot.command("balance", async (ctx) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: ctx.from?.id.toString() }
    });
    
    const balance = user?.balance || 0;
    await ctx.reply(`💰 Your current balance: ${balance} Stars`);
  } catch (error) {
    console.error('Error fetching balance:', error);
    await ctx.reply('❌ Error fetching your balance. Please try again.');
  }
});

/*
  Handles the /withdraw command.
  Provides withdrawal instructions.
*/
bot.command("withdraw", (ctx) => {
  ctx.reply(
    `💳 To withdraw your Stars balance, please contact our support team with your withdrawal request.

Your Telegram ID: ${ctx.from?.id}
Current balance: Check with /balance command

We'll process your withdrawal within 24-48 hours.`
  );
});

/*
  Handles the /refund command.
  Provides refund instructions.
*/
bot.command("refund", (ctx) => {
  ctx.reply(
    `🔄 To request a refund, please provide:
    
1. Your Telegram ID: ${ctx.from?.id}
2. Transaction ID from your purchase
3. Reason for refund

Contact our support team and we'll process your refund within 24-48 hours.`
  );
});

// Webhook only (NO bot.start())
app.use("/webhook", webhookCallback(bot, "express"));

app.get("/", (req, res) => res.send("SamPidia Bot running with webhook"));

app.listen(port, () => {
  console.log(`SamPidia Bot server running on port ${port}`);
});
