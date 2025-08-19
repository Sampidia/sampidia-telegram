"""
A Telegram bot demonstrating Star payments functionality.
This bot allows users to purchase digital items using Telegram Stars and request withdrawal.
"""
import asyncio
from db import Prisma
from prisma.models import User
from prisma.models import Invoice
from prisma.models import Payment
from prisma import withAccelerate
import signal
import sys
import os
import logging
import traceback
from collections import defaultdict
from typing import DefaultDict, Dict
from dotenv import load_dotenv
from telegram import Update, LabeledPrice, InlineKeyboardButton, InlineKeyboardMarkup, Message
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    filters,
    PreCheckoutQueryHandler,
    CallbackContext
)

from dotenv import load_dotenv
from config import ITEMS, MESSAGES

# Load environment variables
load_dotenv()
BOT_TOKEN = os.getenv('BOT_TOKEN')
async def main() -> None:
    db = Prisma(auto_register=True)
    prisma = Prisma()
    await prisma.connect()
    await prisma.user()
    await db.connect()
    await prisma.connect()



# Message texts
WELCOME_MESSAGE = (
    "👋 Welcome to SamPidia Telegram Bot!\n\n"
    "Buy and Sell your Telegram Stars "
    "and read latest posts, chat with friends, use SamPidia Ai.\n\n"
    "🔍 Features:\n"
    "- Buy and Sell Telegram Stars\n"
    "- Blog Post\n"
    "- chat and SamPidia A\n\n"
    "Click the button below to open App!"
)
CONTACT_MESSAGE = (
    "📞 Contact Information\n\n"
    "Website: https://sampidia.com\n"
    "Telegram: @pidia2211\n"
    "Email: sampidia0@gmail.com\n"
)

# Setup logging
logging.basicConfig(
    stream=sys.stdout,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Constants
MINI_APP_URL = "https://sampidia-telegram.vercel.app/"
WELCOME_IMAGE_PATH = 'preview.png'


# Store statistics
STATS: Dict[str, DefaultDict[str, int]] = {
    'purchases': defaultdict(int),
    'withdraws': defaultdict(int),
    
}


async def start(update: Update, context: CallbackContext) :
    logger.info(f"User {update.effective_user.id} started the bot")
    """Handle /start command - show available items."""
    keyboard = [[InlineKeyboardButton(
            "Open Mini App",
            web_app={"url": MINI_APP_URL}
        )]]
    for item_id, item in ITEMS.items():
        keyboard.append([InlineKeyboardButton(
            f"{item['name']} - {item['price']} ⭐",
            callback_data=item_id
        )])

    reply_markup = InlineKeyboardMarkup(keyboard)

    try:
        with open(WELCOME_IMAGE_PATH, 'rb') as photo:
            await update.message.reply_photo(
                photo=photo,
                caption=WELCOME_MESSAGE,
                reply_markup=reply_markup
            )
    except FileNotFoundError:
        logger.error(f"Welcome image not found at {WELCOME_IMAGE_PATH}")
    await update.message.reply_text(
        MESSAGES['welcome'],
        reply_markup=reply_markup
    )


async def help_command(update: Update, context: CallbackContext) :
    logger.info(f"User {update.effective_user.id} requested help")
    """Handle /help command - show help information."""
    await update.message.reply_text(
        MESSAGES['help'],
        parse_mode='Markdown'
    )


async def contact(update: Update, context: CallbackContext):
    logger.info(f"User {update.effective_user.id} requested contact info")
    await update.message.reply_text(CONTACT_MESSAGE)


async def withdraw_command(update: Update, context: CallbackContext) -> None:
    """Handle /withdraw command - process withdraw requests."""
    if not context.args:
        await update.message.reply_text(
            MESSAGES['withdraw_usage']
        )
        return

    try:
        charge_id = context.args[0]
        user_id = update.effective_user.id

        # Call the withdraw API
        success = Prisma.payment('withdrawal').insert({
            "telegramuserid": str(user_id),
            "telegrampaymentchargeid": context.args[0],
            "status": "pending"
        }).execute().data
        if not success:
            raise Exception("Failed to process withdrawal")

        if success:
            STATS['withdraws'][str(user_id)] += 1
            await update.message.reply_text(MESSAGES['withdraw_success'])
        else:
            await update.message.reply_text(MESSAGES['withdraw_failed'])

    except Exception as e:
        error_text = f"Error type: {type(e).__name__}\n"
        error_text += f"Error message: {str(e)}\n"
        error_text += f"Traceback:\n{''.join(traceback.format_tb(e.__traceback__))}"
        logger.error(error_text)

        await update.message.reply_text(
            f"❌ Sorry, there was an error processing your withdrawal:\n"
            f"Error: {type(e).__name__} - {str(e)}\n\n"
            "Please make sure you provided the correct transaction ID and try again. Or contact suppoert t.me/pidia2211 for assistance.",
        )


async def button_handler(update: Update, context: CallbackContext) -> None:
    """Handle button clicks for item selection."""
    query = update.callback_query
    if not query or not query.message:
        return

    try:
        await query.answer()

        item_id = query.data
        item = ITEMS[item_id]

        # Make sure message exists before trying to use it
        if not isinstance(query.message, Message):
            return

        await context.bot.send_invoice(
            chat_id=query.message.chat_id,
            title=item['name'],
            description=item['description'],
            payload=item_id,
            provider_token="",  # Empty for digital goods
            currency="XTR",  # Telegram Stars currency code
            prices=[LabeledPrice(item['name'], int(item['price']))],
            start_parameter="start_parameter"
        )

    except Exception as e:
        logger.error(f"Error in button_handler: {str(e)}")
        if query and query.message and isinstance(query.message, Message):
            await query.message.reply_text(
                "Sorry, something went wrong while processing your request."
            )


async def precheckout_callback(update: Update, context: CallbackContext) -> None:
    """Handle pre-checkout queries."""
    query = update.pre_checkout_query
    if query.invoice_payload in ITEMS:
        await query.answer(ok=True)
    else:
        await query.answer(ok=False, error_message="Something went wrong...")


async def successful_payment_callback(update: Update, context: CallbackContext) -> None:
    """Handle successful payments."""
    payment = update.message.successful_payment
    item_id = payment.invoice_payload
    item = ITEMS[item_id]
    user_id = update.effective_user.id
    telegram_charge_id = payment.telegram_payment_charge_id

    # Update statistics
    STATS['purchases'][str(user_id)] += 1

    logger.info(
        f"Successful payment from user {user_id} "
        f"for item {item_id} (charge_id: {telegram_charge_id})"
    )

     # Save purchase info including telegram_payment_charge_id to prisma
    try:
        response = Prisma.payment('purchases').insert({
            "userid": str(user_id),
            "itemdid": item_id,
            "telegrampaymentchargeid": telegram_charge_id,
            "status": "completed",
            "amount": item['price'],
            "timestamp": "now()"  # or datetime.now() for python datetime
        }).execute()

        if response.error:
            logger.error(f"prisma insert error: {response.error.message}")
        else:
            logger.info(f"Purchase saved to prisma: {response.data}")

    except Exception as e:
        logger.error(f"Error saving purchase to prisma: {str(e)}")

    await update.message.reply_text(
        f"Thank you for your purchase! 🎉\n\n"
        f"Here's your secret code for {item['name']}:\n"
        f"`{item['secret']}`\n\n"
        f"To get a withdraw, use this command:\n"
        f"`/withdraw`\n\n"
        "Save this message to request a withdraw later if needed.",
        parse_mode='Markdown'
    )


async def error_handler(update: Update, context: CallbackContext) -> None:
    """Handle errors caused by Updates."""
    logger.error(f"Update {update} caused error {context.error}")
    if update and update.effective_message:
        await update.effective_message.reply_text(
            "Sorry, something went wrong. Please try again later."
        )


def signal_handler(signum, frame):
    logger.info('Signal received, shutting down...')
    exit(0)


def main() -> None:
    """Start the bot."""
    try:
        application = Application.builder().token(BOT_TOKEN).build()

        # Add handlers
        application.add_handler(CommandHandler("start", start))
        application.add_handler(CommandHandler("help", help_command))
        application.add_handler(CommandHandler("contact", contact))
        application.add_handler(CommandHandler("withdraw", withdraw_command))
        application.add_handler(CallbackQueryHandler(button_handler))
        application.add_handler(PreCheckoutQueryHandler(precheckout_callback))
        application.add_handler(MessageHandler(filters.SUCCESSFUL_PAYMENT, successful_payment_callback))

        # Add error handler
        application.add_error_handler(error_handler)

        # Setup signal handler
        signal.signal(signal.SIGINT, signal_handler)

        # Start the bot
        logger.info("Bot started")
        application.run_polling(allowed_updates=Update.ALL_TYPES)

    except Exception as e:
        logger.error(f"Error starting bot: {str(e)}")


if __name__ == '__main__':
    main()