import { Bot } from "grammy";
import * as dotenv from "dotenv";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL || "https://sampidia-telegram.vercel.app/api/webhook";

if (!token) {
    console.error("❌ Error: TELEGRAM_BOT_TOKEN or BOT_TOKEN not found in .env");
    process.exit(1);
}

const bot = new Bot(token);

async function register() {
    console.log(`📡 Registering webhook for bot...`);
    console.log(`Target URL: ${webhookUrl}`);

    try {
        await bot.api.setWebhook(webhookUrl, {
            allowed_updates: ["message", "pre_checkout_query", "callback_query"]
        });

        const info = await bot.api.getWebhookInfo();
        console.log("✅ Webhook registered successfully!");
        console.log("Webhook Info:", JSON.stringify(info, null, 2));
    } catch (error) {
        console.error("❌ Failed to register webhook:", error);
    }
}

register();
