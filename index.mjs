import { Bot } from "grammy";

const bot = new Bot(process.env.BOT_TOKEN);
// Map is used to keep track of users who have paid. In a production scenario, replace with a database.
const paidUsers = new Map();

/*
  Handles the /start command.
  Sends a welcome message to the user and explains the available commands for interacting with the bot.
*/
bot.command("info", (ctx) =>
  ctx.reply(
    `Welcome! to SamPidia, we buy and sell Telegram Stars. The following commands are available:

/sell-1 - to sell 1 star
/sell-25 - to sell 25 stars
/status - to check payment status
/refund - to refund payment`,
  ),
);

/*
  Handles the /sell command.
  Generates an invoice that users can click to make a payment. The invoice includes the product name, description, and payment options.
  Note: Replace "Test Product", "Test description", and other placeholders with actual values in production.
*/
bot.command("sell-1", (ctx) => {
  return ctx.replyWithInvoice(
    "1 Star", // Product name
    "one", // Product description
    "1", // Payload (replace with meaningful data)
    "XTR", // Currency
    [{ amount: 1, label: "One Star" }], // Price breakdown
  );
});

bot.command("sell-25", (ctx) => {
  return ctx.replyWithInvoice(
    "25 Stars", // Product name
    "twentyfive", // Product description
    "25", // Payload (replace with meaningful data)
    "XTR", // Currency
    [{ amount: 25, label: "Twentyfive Stars" }], // Price breakdown
  );
});

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
  Updates the paidUsers map to record the payment details and logs the successful payment.
*/
bot.on("message:successful_payment", (ctx) => {
  if (!ctx.message || !ctx.message.successful_payment || !ctx.from) {
    return;
  }

  paidUsers.set(
    ctx.from.id, // User ID
    ctx.message.successful_payment.telegram_payment_charge_id, // Payment ID
  );

  console.log(ctx.message.successful_payment);
});

/*
  Handles the /status command.
  Checks if the user has made a payment and responds with their payment status.
*/
bot.command("status", (ctx) => {
  const message = paidUsers.has(ctx.from.id)
    ? "You have paid"
    : "You have not paid yet";
  return ctx.reply(message);
});

/*
  Handles the /refund command.
  Refunds the payment made by the user if applicable. If the user hasn't paid, informs them that no refund is possible.
*/
bot.command("refund", (ctx) => {
  const userId = ctx.from.id;
  if (!paidUsers.has(userId)) {
    return ctx.reply("You have not paid yet, there is nothing to refund");
  }

  ctx.api
    .refundStarPayment(userId, paidUsers.get(userId))
    .then(() => {
      paidUsers.delete(userId);
      return ctx.reply("Refund successful");
    })
    .catch(() => ctx.reply("Refund failed"));
});

/* API Route: Pre-Checkout Handler */
bot.on("pre_checkout_query", (ctx) => {
  return ctx.answerPreCheckoutQuery(true).catch(() => {
    console.error("answerPreCheckoutQuery failed");
  });
});

/* Prisma + APp Call the API Route */
bot.on("message:successful_payment", async (ctx) => {
  if (!ctx.message || !ctx.message.successful_payment || !ctx.from) return;

  await fetch("${process.env.APP_URL}/api/payment-success", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: ctx.from.id,
      transactionId: ctx.message.successful_payment.telegram_payment_charge_id,
      productName : ctx.message.successful_payment.invoice_product_description
      amount: ctx.message.successful_payment.invoice_payload, 
      itemId: ctx.message.successful_payment.invoice_product_description// or your item identifier
    }),
  });
});

/* Prisma App Payment Status */
const payment = await prisma.payment.findFirst({
  where: { telegramUserId: String(ctx.from.id), status: "COMPLETED" },
});
const message = payment ? "You have paid" : "You have not paid yet";
ctx.reply(message);

// Starts the bot and makes it ready to receive updates and process commands.
bot.start();