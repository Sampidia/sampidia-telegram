#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 SamPidia Telegram Stars Payment App Setup');
console.log('============================================\n');

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setup() {
  try {
    // Check if .env file exists
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const overwrite = await askQuestion('⚠️  .env file already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Setup cancelled.');
        rl.close();
        return;
      }
    }

    console.log('\n📝 Please provide the following information:\n');

    const botToken = await askQuestion('🤖 Telegram Bot Token (from @BotFather): ');
    const databaseUrl = await askQuestion('🗄️  MongoDB Database URL (default: mongodb://localhost:27017/sampidia): ') || 'mongodb://localhost:27017/sampidia';
    const nextAuthSecret = await askQuestion('🔐 NextAuth Secret (press Enter to generate): ') || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const nextAuthUrl = await askQuestion('🌐 NextAuth URL (default: http://localhost:3000): ') || 'http://localhost:3000';

    // Create .env content
    const envContent = `# Telegram Bot Configuration
BOT_TOKEN=${botToken}

# Database Configuration
DATABASE_URL="${databaseUrl}"
DIRECT_DATABASE_URL="${databaseUrl}"

# Next.js Configuration
NEXTAUTH_SECRET=${nextAuthSecret}
NEXTAUTH_URL=${nextAuthUrl}

# Webhook URL (for production)
WEBHOOK_URL=https://your-domain.com/webhook
`;

    // Write .env file
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Environment variables configured successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Install dependencies: npm install');
    console.log('2. Generate Prisma client: npx prisma generate');
    console.log('3. Push database schema: npx prisma db push');
    console.log('4. Start development server: npm run dev');
    console.log('5. Start bot server: npm run start:bot');
    console.log('\n📖 For detailed instructions, see SETUP.md');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

setup();
