import { Bot } from "grammy";
import * as dotenv from "dotenv";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;

if (!token) {
    console.error("❌ Error: TELEGRAM_BOT_TOKEN or BOT_TOKEN not found in .env");
    process.exit(1);
}

const bot = new Bot(token);

async function setLocal() {
    console.log("🛠️ Switching bot to local mode (Long Polling)...");
    try {
        await bot.api.deleteWebhook();
        console.log("✅ Webhook deleted! Telegram will now wait for long polling.");
        console.log("🚀 You can now run 'npx ts-node bot.ts' to test locally.");
    } catch (error) {
        console.error("❌ Failed to delete webhook:", error);
    }
}

setLocal();
