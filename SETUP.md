# SamPidia Telegram Stars Payment App - Setup Guide

## Overview
This is a complete Telegram Web App that accepts Stars payments and integrates with a Telegram bot for payment processing. The app allows users to purchase Stars packages and manage their purchases.

## Features
- ✅ Telegram Web App integration
- ✅ Stars payment processing
- ✅ Purchase history tracking
- ✅ User balance management
- ✅ Withdrawal and refund functionality
- ✅ Database integration with Prisma
- ✅ Modern UI with Tailwind CSS

## Prerequisites
- Node.js 18+ and npm
- MongoDB database
- Telegram Bot Token (from @BotFather)
- Telegram Web App setup

## Installation

### 1. Clone and Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
# Telegram Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here

# Database Configuration
DATABASE_URL="mongodb://localhost:27017/sampidia"
DIRECT_DATABASE_URL="mongodb://localhost:27017/sampidia"

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 4. Telegram Bot Setup

1. **Create a Bot** with @BotFather on Telegram
2. **Enable Payments** in your bot settings
3. **Set up Web App** URL in bot settings
4. **Configure Webhook** for payment processing

### 5. Run the Application

#### Development Mode
```bash
# Start the Next.js app
npm run dev

# Start the bot server (in another terminal)
npm run start:bot
```

#### Production Mode
```bash
# Build the app
npm run build

# Start both web app and bot
npm start
```

## Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── create-invoice/     # Creates payment invoices
│   │   ├── payment-success/    # Handles successful payments
│   │   ├── purchases/          # Fetches purchase history
│   │   ├── get-secret/         # Retrieves purchase secrets
│   │   └── withdraw/           # Handles withdrawals
│   ├── components/             # React components
│   ├── data/                   # Static data (items, prices)
│   └── types/                  # TypeScript type definitions
├── bot.ts                      # Telegram bot implementation
├── prisma/                     # Database schema and migrations
└── public/                     # Static assets
```

## API Endpoints

### Create Invoice
- **POST** `/api/create-invoice`
- Creates a payment invoice for Stars purchase

### Payment Success
- **POST** `/api/payment-success`
- Records successful payments in database

### Get Purchases
- **GET** `/api/purchases?userId={userId}`
- Retrieves user's purchase history

### Get Secret
- **GET** `/api/get-secret?itemId={itemId}&transactionId={transactionId}`
- Retrieves secret code for purchased item

## Bot Commands

- `/start` - Welcome message and available commands
- `/send1` - Purchase 1 Star for ₦1
- `/send25` - Purchase 25 Stars for ₦450
- `/send50` - Purchase 50 Stars for ₦900
- `/send100` - Purchase 100 Stars for ₦1,800
- `/send500` - Purchase 500 Stars for ₦9,000
- `/send1000` - Purchase 1000 Stars for ₦18,000
- `/balance` - Check current balance
- `/withdraw` - Withdrawal instructions
- `/refund` - Refund instructions

## Database Schema

### User
- `id` - Unique identifier
- `telegramId` - Telegram user ID
- `balance` - Current Stars balance
- `payments` - Related payments

### Payment
- `id` - Unique identifier
- `userId` - User ID
- `telegramId` - Telegram user ID
- `transactionId` - Payment transaction ID
- `itemId` - Purchased item ID
- `amount` - Payment amount
- `status` - Payment status

### Invoice
- `id` - Unique identifier
- `userId` - User ID
- `title` - Invoice title
- `description` - Invoice description
- `amount` - Invoice amount
- `status` - Invoice status

## Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check BOT_TOKEN in .env
   - Ensure webhook is properly configured
   - Verify bot has payment permissions

2. **Database connection issues**
   - Check DATABASE_URL in .env
   - Ensure MongoDB is running
   - Run `npx prisma generate` and `npx prisma db push`

3. **Payment not processing**
   - Verify Stars payment is enabled in bot settings
   - Check webhook URL configuration
   - Ensure proper error handling in payment callbacks

4. **Web App not loading**
   - Check Web App URL in bot settings
   - Verify HTTPS is enabled for production
   - Check browser console for errors

### Development Tips

1. **Testing Payments**
   - Use Telegram's test mode for development
   - Monitor webhook logs for payment events
   - Test with small amounts first

2. **Database Management**
   - Use Prisma Studio: `npx prisma studio`
   - Monitor database logs for errors
   - Backup data regularly

3. **Deployment**
   - Use environment variables for sensitive data
   - Set up proper webhook URLs for production
   - Configure SSL certificates for HTTPS

## Support

For issues and questions:
- Create an issue in the repository
- Contact support at t.me/pidia2211
- Check the Telegram bot documentation

## License

This project is licensed under the ISC License.
