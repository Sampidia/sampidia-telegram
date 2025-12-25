import { Bot } from "grammy";
import * as dotenv from "dotenv";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;

if (!token) {
    console.error("❌ Error: TELEGRAM_BOT_TOKEN or BOT_TOKEN not found in .env");
    process.exit(1);
}

const bot = new Bot(token);

async function verify() {
    console.log("🔍 Verifying bot connection...");
    try {
        const me = await bot.api.getMe();
        console.log("✅ Connection successful!");
        console.log(`Bot Name: ${me.first_name}`);
        console.log(`Bot Username: @${me.username}`);

        const webhookInfo = await bot.api.getWebhookInfo();
        console.log("Webhook URL:", webhookInfo.url || "None set");
    } catch (error) {
        console.error("❌ Failed to connect to Telegram API. Is your token correct?");
        if (error instanceof Error) {
            console.error("Error details:", error.message);
        }
    }
}

verify();
