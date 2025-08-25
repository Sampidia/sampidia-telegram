#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests database connectivity and verifies seed data
 */

const { PrismaClient } = require('@prisma/client');
const { withAccelerate } = require('@prisma/extension-accelerate');

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection');
  console.log('=====================================');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`POSTGRES_URL: ${process.env.POSTGRES_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`DIRECT_DATABASE_URL: ${process.env.DIRECT_DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  
  if (process.env.DATABASE_URL) {
    console.log(`DATABASE_URL type: ${process.env.DATABASE_URL.startsWith('prisma+postgres://') ? 'Prisma Accelerate' : 'Direct Connection'}`);
  }
  
  let prisma = null;
  
  try {
    // Initialize Prisma client
    console.log('\n🔧 Initializing Prisma Client...');
    
    if (process.env.DATABASE_URL?.startsWith('prisma+postgres://')) {
      console.log('Using Prisma Accelerate');
      prisma = new PrismaClient({
        datasourceUrl: process.env.DATABASE_URL,
        log: ['error', 'warn', 'info'],
      }).$extends(withAccelerate());
    } else {
      console.log('Using Direct Connection');
      const connectionUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DIRECT_DATABASE_URL;
      prisma = new PrismaClient({
        datasourceUrl: connectionUrl,
        log: ['error', 'warn', 'info'],
      });
    }
    
    console.log('✅ Prisma client initialized');
    
    // Test basic connection
    console.log('\n🔌 Testing Database Connection...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    
    // Check if users table exists and has data
    console.log('\n👥 Checking Users Table...');
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    if (userCount === 0) {
      console.log('⚠️  No users found. You may need to run the seed script.');
    } else {
      // Get all users
      const users = await prisma.user.findMany({
        select: {
          telegramId: true,
          firstName: true,
          balance: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log('\n📋 Users in Database:');
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.firstName || 'Unknown'} (ID: ${user.telegramId}) - Balance: ${user.balance} ⭐`);
      });
    }
    
    // Test specific test users
    console.log('\n🧪 Testing Specific Users...');
    const testUsers = ['2111112', '21155555'];
    
    for (const telegramId of testUsers) {
      try {
        const user = await prisma.user.findUnique({
          where: { telegramId },
          select: { telegramId: true, firstName: true, balance: true }
        });
        
        if (user) {
          console.log(`✅ User ${telegramId}: ${user.firstName} - Balance: ${user.balance} ⭐`);
        } else {
          console.log(`❌ User ${telegramId}: Not found`);
        }
      } catch (error) {
        console.log(`❌ Error querying user ${telegramId}:`, error.message);
      }
    }
    
    // Test user creation (if needed)
    console.log('\n🆕 Testing User Creation...');
    const testTelegramId = '99999999';
    
    try {
      // Check if test user exists
      let testUser = await prisma.user.findUnique({
        where: { telegramId: testTelegramId }
      });
      
      if (testUser) {
        console.log(`✅ Test user ${testTelegramId} already exists`);
      } else {
        // Create test user
        testUser = await prisma.user.create({
          data: {
            telegramId: testTelegramId,
            firstName: 'Test User Creation',
            balance: 0
          }
        });
        console.log(`✅ Created test user ${testTelegramId} successfully`);
        
        // Clean up - delete the test user
        await prisma.user.delete({
          where: { telegramId: testTelegramId }
        });
        console.log(`🧹 Cleaned up test user ${testTelegramId}`);
      }
    } catch (error) {
      console.log(`❌ Error testing user creation:`, error.message);
    }
    
    console.log('\n✅ All database tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Database test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    
    // Provide troubleshooting suggestions
    console.log('\n💡 Troubleshooting Suggestions:');
    console.log('1. Verify your DATABASE_URL is correct');
    console.log('2. Check if the database server is running');
    console.log('3. Ensure your database credentials are valid');
    console.log('4. Try running: npx prisma db push');
    console.log('5. Try running: npx prisma generate');
    console.log('6. Check network connectivity to the database');
    
  } finally {
    if (prisma) {
      await prisma.$disconnect();
      console.log('\n🔌 Disconnected from database');
    }
  }
}

// Run the test
testDatabaseConnection().catch(console.error);