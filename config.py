from typing import Dict, Any

ITEMS: Dict[str, Dict[str, Any]] = {
    'one': {
        'name': '1 Star ✨',
        'price': 1,
        'description': '₦18',
        'secret': '1stars2025'
    },
    'twentyfive': {
        'name': '25 Stars 🌟',
        'price': 25,
        'description': '₦450',
        'secret': '25stars2025'
    },
    'fifty': {
        'name': '50 Stars ⭐',
        'price': 50,
        'description': '₦910',
        'secret': '50stars2025'
    }
}

MESSAGES = {
    'welcome': (
        "Welcome to SamPidia! 🎉\n"
        "Select an item to Sell Telegram Stars:"
    ),
    'help': (
        "🛍 *SamPidia Store Bot Help*\n\n"
        "Commands:\n"
        "/start - View available items\n"
        "/help - Show this help message\n"
        "/refund - Request a refund (requires transaction ID)\n\n"
        "How to use:\n"
        "1. Use /start to see available items\n"
        "2. Click on an item to purchase\n"
        "3. Pay with Stars\n"
        "4. Receive your secret code\n"
        "5. Use /refund to get a refund if needed"
    ),
    'refund_success': (
        "✅ Refund processed successfully!\n"
        "The Stars have been returned to your balance."
    ),
    'refund_failed': (
        "❌ Refund could not be processed.\n"
        "Please try again later or contact support."
    ),
    'refund_usage': (
        "Please provide the transaction ID after the /refund command.\n"
        "Example: `/refund YOUR_TRANSACTION_ID`"
    )
}