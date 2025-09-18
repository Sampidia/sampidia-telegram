# SamPidia Telegram App

SamPidia Telegram app is for  selling and buying Telegram Stars, with withdrawal from balance function nd read latest posts, chat with friends, use SamPidia Ai. Built with Next.js 15, TypeScript, Tailwind CSS, Python 3.7 or higher, python-dotenv library, and Telegram Bot API, this app includes secure invoice generation, purchase history, secret content access after purchase, and refund processing via a Python companion bot. Ideal for Web3 developers, Telegram bot creators, and digital entrepreneurs looking to monetize through Telegram's payment ecosystem.

> **Note:** This application is designed to work exclusively within the Telegram ecosystem as a Telegram Mini App. It should be accessed only through Telegram and not directly via a web browser.

## Features

- 💸 Telegram Stars integration for payments
- 🔄 Purchase history tracking
- 📱 Responsive design optimized for Telegram WebApp
- 🔑 Secret code delivery for purchased digital items
- 🔄 Refund support via companion bot

## Prerequisites

- Node.js 18+ and npm
- A Telegram bot token (obtained from BotFather)
- Vercel account (for deployment)

## Getting Started with Next.js build

### 1. Open project folder, in terminal, run

npm install
```

### 2. Check there is no errors during the build

```bash
npm run build
```

> **Note:** The app will only function correctly when accessed through Telegram. 

### 3. Set up the Python Telegram Companion Bot
For the companion bot with refund capabilities, visit the separate repository:

## Deployment
As this is a Telegram Mini App, it must be deployed and accessed through Telegram. Follow these steps:

1. Push your code to a GitHub repository
2. Sign up for a Vercel account if you haven't already
3. Connect your GitHub repository to Vercel and deploy the app
4. During deployment, add your `BOT_TOKEN` as an environment variable in the Vercel dashboard
5. Once deployed, Vercel will provide you with a URL for your app
6. Use this URL to set up your Telegram Mini App:
   - Go to [@BotFather](https://t.me/BotFather) on Telegram
   - Send the command `/newapp` or choose to edit an existing bot
   - Follow the prompts to set up your Mini App, using the Vercel URL as the Web App URL
7. Once set up, you can access your Mini App through Telegram on mobile devices or in the Web version of Telegram


## How It Works

### Telegram Stars Payment Flow
1. User clicks "Buy" on a digital item
2. App creates an invoice through Telegram Bot API
3. Telegram shows the payment interface
4. User approves the payment with Stars
5. App receives a success callback and shows the secret code
6. Purchase is recorded in the history


# Python Telegram Companion Bot with Stars Payment Integration

## Project Overview
This bot demonstrates:
- Telegram Stars payment processing
- Digital item sales
- Payment refund functionality
- Inline keyboard integration
- Comprehensive error handling
- Statistics tracking

## Prerequisites
- A Telegram Bot Token (from @BotFather)
- Grammy
- NextJS


## Project Structure
- `README.md`: Project documentation

## Key Features
- Asynchronous command handling
- Stars payment processing
- Refund functionality
- Error handling and logging
- Statistics tracking
- Environment variable management

## Technologies Used
- NextJS
- Telegram Bot API
- Telegram Stars Payment System

## Bot Configuration
1. Create a new bot with @BotFather
2. Copy the bot token
3. Set up commands using /setcommands:
   ```
   start - View available items for purchase
   help - Show help message
   refund - Request a refund (requires transaction ID)
   ```

## Payment Flow
1. User selects an item from the menu
2. Bot generates a Stars payment invoice
3. User completes the payment
4. Bot reveals the secret code
5. User can request a refund using the transaction ID

## Error Handling
The bot includes comprehensive error handling:
- Payment processing errors
- Refund processing errors
- Invalid input handling
- General error catching
- Detailed logging for debugging

# Python Telegram Bot with Mini App Integration
## Project Overview
This bot demonstrates:
- Basic command handling
- Inline keyboard integration 
- Mini App integration
- Interactive responses
- Logging and error handling

## Bot Features
- `/start` - Welcome message with Mini App button
- `/send` - List all available products
- `/balance` - Get balance information
- `/withdraw` - Display withdrawal details
- `/refund` - Learn about refund



## Mini App Integration
The bot includes a button that opens a Mini App. To set up your own Mini App:
1. Host your web application
2. Add domain to @BotFather's Bot Settings > Web App Settings
3. Update MINI APP URL in the code
4. Test the integration

## Error Handling
The bot includes comprehensive error handling:
- File not found handling
- Command execution errors
- General error catching
- Logging for debugging

## Contributing
Contributions are welcome! Please feel free to submit issues and pull requests.

## Learn More
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [python-telegram-bot Documentation](https://python-telegram-bot.org/)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)

## Author
### SamPidia
- 🌐 Website: https://sampidia.com
- 💻 GitHub: https://github.com/Sampidia/