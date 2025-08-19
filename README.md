# SamPidia Telegram App

SamPidia Telegram app is for  selling and buying Telegram Stars, with withdrawal from balance function nd read latest posts, chat with friends, use SamPidia Ai. Built with Next.js 15, TypeScript, Tailwind CSS, Python 3.7 or higher, python-telegram-bot library, python-dotenv library, and Telegram Bot API, this app includes secure invoice generation, purchase history, secret content access after purchase, and refund processing via a Python companion bot. Ideal for Web3 developers, Telegram bot creators, and digital entrepreneurs looking to monetize through Telegram's payment ecosystem.

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
- Python 3.7+ (for the companion bot)
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

## Project Structure
- `/app` - Next.js application
  - `/api` - API routes for invoice creation, payment processing, and purchase history
  - `/components` - React UI components (modals, cards, loaders, etc.)
  - `/data` - Shared item definitions and configurations
  - `/server` - Server-only code, including sensitive data like secret codes
  - `/types` - TypeScript type definitions and interfaces
  - `page.tsx` - Main application component
  - `layout.tsx` - Root layout component
  - `globals.css` - Global styles
- `/public` - Static assets

## How It Works

### Telegram Stars Payment Flow
1. User clicks "Buy" on a digital item
2. App creates an invoice through Telegram Bot API
3. Telegram shows the payment interface
4. User approves the payment with Stars
5. App receives a success callback and shows the secret code
6. Purchase is recorded in the history

### Refund Flow
1. User requests a refund through the companion Telegram bot
2. Bot processes the refund using Telegram's API
3. Stars are returned to the user's account

## Learn More
- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [Telegram Bot API - Payments](https://core.telegram.org/bots/api#payments)
- [Next.js Documentation](https://nextjs.org/docs)


# Python Telegram Companion Bot with Stars Payment Integration

## Project Overview
This bot demonstrates:
- Telegram Stars payment processing
- Digital item sales
- Payment refund functionality
- Inline keyboard integration
- Comprehensive error handling
- Statistics tracking

## Bot Features
- `/start` - View available items for purchase
- `/help` - List all available commands
- `/refund` - Process refund for a previous purchase

## Prerequisites
- A Telegram Bot Token (from @BotFather)
- Python 3.7 or higher
- python-telegram-bot library
- python-dotenv library

## Getting Started
### Using Terminal
1. Open project folder
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file:
   ```
   BOT_TOKEN=your_bot_token_here
   ```
4. Run the bot:
   ```bash
   python main.py
   ```

## Project Structure
- `main.py`: Main bot script with handlers and business logic
- `config.py`: Configuration settings and item definitions
- `.env`: Environment variables (not included in repo)
- `requirements.txt`: Project dependencies
- `README.md`: Project documentation

## Key Features
- Asynchronous command handling
- Stars payment processing
- Refund functionality
- Error handling and logging
- Statistics tracking
- Environment variable management

## Technologies Used
- Python 3
- python-telegram-bot
- python-dotenv
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

## Learn More
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [python-telegram-bot Documentation](https://python-telegram-bot.org/)
- [Telegram Payments](https://core.telegram.org/bots/payments)


# Python Telegram Bot with Mini App Integration
## Project Overview
This bot demonstrates:
- Basic command handling
- Inline keyboard integration 
- Mini App integration
- Image sharing capability
- Interactive responses
- Logging and error handling

## Bot Features
- `/start` - Welcome message with Mini App button
- `/help` - List all available commands
- `/info` - Get bot information
- `/contact` - Display contact details
- `/about` - Learn about the project

## Prerequisites
- Python 3.7 or higher
- python-telegram-bot library
- python-dotenv library
- A Telegram Bot Token (from @BotFather)
- A web server for hosting Mini App (optional)

## Getting Started

### Option 1: Using PyCharm
1. Open PyCharm
2. Go to `File > Project from Version Control`
3. Enter URL: `https://github.com/nikandr-surkov/python-telegram-bot.git`
4. Choose your project directory
5. Click "Clone"
6. Install dependencies:
   ```bash
   pip install python-telegram-bot python-dotenv
   ```

### Option 2: Using Terminal
1. import files and open project folder

2. Install dependencies:
   ```bash
   pip install python-telegram-bot python-dotenv
   ```

3. Create a `.env` file:
   ```
   BOT_TOKEN=your_bot_token_here
   ```

4. Run the bot:
   ```bash
   python main.py
   ```

## Project Structure
- `main.py`: Main bot script with all handlers and logic
- `.env`: Environment variables (not included in repo)
- `preview.png`: Welcome image
- `README.md`: Project documentation

## Key Features
- Asynchronous command handling
- Inline keyboard for Mini App launch
- Error handling and logging
- Signal handling for graceful shutdown
- Environment variable management
- Image sharing capability

## Technologies Used
- Python 3
- python-telegram-bot
- python-dotenv
- Telegram Bot API
- Telegram Mini Apps

## Bot Configuration
1. Create a new bot with @BotFather
2. Enable inline mode if needed
3. Set up commands using /setcommands:
   ```
   start - Start the bot and see welcome message
   help - Show help message
   info - Get information about the bot
   contact - Get contact information
   about - Learn more about the project
   ```
4. Set up your Mini App domain in Bot Settings

## Mini App Integration
The bot includes a button that opens a Mini App. To set up your own Mini App:
1. Host your web application
2. Add domain to @BotFather's Bot Settings > Web App Settings
3. Update MINI_APP_URL in the code
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