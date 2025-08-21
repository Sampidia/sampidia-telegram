// server.ts
import express from "express";
import { Bot, webhookCallback } from "grammy";

const app = express();
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

bot.command("start", (ctx) => ctx.reply("Hello from Express + Grammy!"));

app.use(express.json());
app.use("/webhook", webhookCallback(bot, "express"));

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  await bot.api.setWebhook(`${process.env.WEBHOOK_URL}/webhook`);
});
