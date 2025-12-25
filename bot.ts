import express from "express";
import { Bot, webhookCallback } from "grammy";
import { setupBot } from "./lib/bot-logic";

const app = express();
const port = 3001;

// Create an instance of the `Bot` class and pass your bot token to it.
const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "";
if (!token) {
  console.warn("WARNING: No bot token found in environment variables!");
}
const bot = new Bot(token);

// Attach all command handlers and logic
setupBot(bot);

app.use(express.json());

// Webhook handling (optional, if this server is exposed)
if (process.env.WEBHOOK_URL) {
  app.use("/api/webhook", webhookCallback(bot, "express"));
}

app.get("/", (req, res) => res.send("SamPidia Bot running"));

app.listen(port, async () => {
  console.log(`🚀 SamPidia Bot server running on port ${port}`);

  if (!process.env.WEBHOOK_URL) {
    console.log("🛠️ WEBHOOK_URL not set, starting long polling...");
    bot.start();
  } else {
    console.log(`� Bot configured to use webhooks at ${process.env.WEBHOOK_URL}/api/webhook`);
  }
});
