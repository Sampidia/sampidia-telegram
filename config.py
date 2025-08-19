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
    },
    'hundred': {
        'name': '100 Stars ⭐',
        'price': 100,
        'description': '₦1,800',
        'secret': '100stars2025'
    },
    'fivehundred': {
        'name': '500 Stars ⭐',
        'price': 500,
        'description': '₦9,000',
        'secret': '500stars2025'
    },
    'onethousand': {
        'name': '1000 Stars ⭐',
        'price': 1000,
        'description': '₦18,000',
        'secret': '1000stars2025'
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
        "/withdraw - Request a withdrawal (requires transaction ID)\n\n"
        "How to use:\n"
        "1. Use /start to see available items\n"
        "2. Click on an item to purchase\n"
        "3. Pay with Stars\n"
        "4. Receive your secret code\n"
        "5. Use /withdraw to get a withdrawal if needed"
    ),
    'withdraw_success': (
        "✅ Wiithdrawal processed successfully!\n"
        "The payment have been returned to your balance."
    ),
    'withdraw_failed': (
        "❌ Wiithdrawal could not be processed.\n"
        "Please try again later or contact support."
    ),
    'withraw_usage': (
        "Please provide the transaction ID after the /withdraw command.\n"
        "Example: `/withdraw YOUR_TRANSACTION_ID`"
    )
}