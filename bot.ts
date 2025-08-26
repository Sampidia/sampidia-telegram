import express from "express";
import { Bot, webhookCallback } from "grammy";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const app = express();
const port = 3001;


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
  ctx.reply(
    `Welcome to SamPidia! 🌟 I am a bot that can accept payments via Telegram Stars. The following commands are available:

/send1 - Sell 1 Star for $0.008
/send25 - Sell 25 Stars for $0.2
/send50 - Sell 50 Stars for $0.4
/send100 - Sell 100 Stars for $0.8
/send500 - Sell 500 Stars for $4
/send1000 - Sell 1000 Stars for $8
/balance - Check your current balance
/withdraw - Withdraw your balance
/refund - Request a refund for a purchase
`,
  );
});

// Handle payment requests from web app
async function handlePaymentRequest(ctx: any, itemId: string, userId: string) {
  try {
    // Get item details
    const { ITEMS } = await import('./app/data/items');
    const item = ITEMS.find(i => i.id === itemId);
    
    if (!item) {
      await ctx.reply('❌ Item not found. Please try again.');
      return;
    }

    // Create Telegram Stars payment
    const payment = await ctx.replyWithInvoice(
      item.name,
      item.description,
      JSON.stringify({ 
        itemId: item.id,
        userId: userId
      }),
      "", // Provider token (empty for Telegram Stars)
      "XTR", // Currency for Telegram Stars
      [{ amount: item.price, label: item.name }]
    );

    console.log('Payment invoice created:', payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    await ctx.reply('❌ Failed to create payment. Please try again.');
  }
}

// Helper function to create invoice for direct commands
const createInvoice = (ctx: any, itemName: string, itemDescription: string, amount: number) => {
  return ctx.replyWithInvoice(
    itemName,
    itemDescription,
    JSON.stringify({ 
      itemId: itemName.toLowerCase().replace(/\s+/g, ''),
      userId: ctx.from?.id 
    }),
    "", // Provider token (empty for Telegram Stars)
    "XTR", // Currency for Telegram Stars
    [{ amount: amount, label: itemName }],
  );
};

// Star purchase commands
bot.command("send1", (ctx) => createInvoice(ctx, "1 Star ✨", "$0.009", 1));
bot.command("send25", (ctx) => createInvoice(ctx, "25 Stars 🌟", "$0.225", 25));
bot.command("send50", (ctx) => createInvoice(ctx, "50 Stars ⭐", "$0.45", 50));
bot.command("send100", (ctx) => createInvoice(ctx, "100 Stars ⭐", "$0.9", 100));
bot.command("send500", (ctx) => createInvoice(ctx, "500 Stars ⭐", "$4.5", 500));
bot.command("send1000", (ctx) => createInvoice(ctx, "1000 Stars ⭐", "$9", 1000));

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

// Bot commands only - payment success events are handled by the webhook route
// since Telegram sends successful_payment events to the webhook URL, not back to the bot

/*
  Handles the /balance command.
  Shows the user's current balance.
*/
bot.command("balance", async (ctx) => {
  try {
    if (!ctx.from?.id) {
      await ctx.reply('❌ Unable to identify your Telegram ID. Please try again.');
      return;
    }

    const telegramId = ctx.from.id.toString();
    
    const user = await prisma.user.findUnique({
      where: { telegramId: telegramId },
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

// Bot commands only - webhook handling is done by the webhook route
app.get("/", (req, res) => res.send("SamPidia Bot running (commands only)"));

app.listen(port, async () => {
  console.log(`SamPidia Bot server running on port ${port} (commands only)`);
  console.log(`Bot token: ${process.env.BOT_TOKEN ? 'Set' : 'Using default'}`);
  console.log("Note: Webhook is handled by app/api/webhook/route.ts");
});
