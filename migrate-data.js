#!/usr/bin/env node

/**
 * Data Migration Script: PostgreSQL to MongoDB
 * Migrates existing data from PostgreSQL to MongoDB
 */

const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');

async function migrateData() {
  console.log('🚀 Starting Data Migration: PostgreSQL → MongoDB');
  console.log('==================================================');

  let postgresClient = null;
  let mongoPrisma = null;

  try {
    // Initialize PostgreSQL connection using native pg client
    console.log('🔌 Connecting to PostgreSQL...');
    postgresClient = new Client({
      connectionString: process.env.POSTGRES_URL
    });
    await postgresClient.connect();

    // Initialize MongoDB connection
    console.log('🔌 Connecting to MongoDB...');
    mongoPrisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
      log: ['error', 'warn']
    });

    // Test connections
    const testResult = await postgresClient.query('SELECT 1 as test');
    console.log('✅ PostgreSQL connection successful');

    await mongoPrisma.user.count();
    console.log('✅ MongoDB connection successful');
    console.log('✅ Both database connections successful');

    // Migration statistics
    const stats = {
      users: 0,
      purchases: 0,
      invoices: 0,
      payments: 0,
      withdrawals: 0
    };

    // 1. Migrate Users
    console.log('\n👥 Migrating Users...');
    const usersQuery = `
      SELECT
        "id", "telegramId", "firstName", "lastName", "username",
        "balance", "withdrawalAmount", "isActive", "lastSeenAt",
        "createdAt", "updatedAt"
      FROM "User"
    `;
    const usersResult = await postgresClient.query(usersQuery);
    const users = usersResult.rows;
    console.log(`Found ${users.length} users to migrate`);

    for (const user of users) {
      try {
        // Clean user data (remove SQL-specific fields)
        const { id, ...userData } = user;

        // Create user in MongoDB
        const newUser = await mongoPrisma.user.create({
          data: userData
        });

        console.log(`✅ Migrated user: ${user.firstName || 'Unknown'} (${user.telegramId})`);
        stats.users++;

        // Migrate user's purchases
        const purchasesQuery = `
          SELECT "id", "itemId", "itemName", "itemSecret", "createdAt"
          FROM "Purchase" WHERE "userId" = $1
        `;
        const purchasesResult = await postgresClient.query(purchasesQuery, [user.id]);
        const purchases = purchasesResult.rows;

        for (const purchase of purchases) {
          const { id: purchaseId, ...purchaseData } = purchase;
          await mongoPrisma.purchase.create({
            data: {
              ...purchaseData,
              userId: newUser.id
            }
          });
          stats.purchases++;
        }

        // Migrate user's withdrawals
        const withdrawalsQuery = `
          SELECT "id", "amount", "withdrawMethod", "bankName", "accountNumber",
                 "accountName", "tonAddress", "status", "emailSent", "createdAt", "processedAt"
          FROM "Withdrawal" WHERE "userId" = $1
        `;
        const withdrawalsResult = await postgresClient.query(withdrawalsQuery, [user.id]);
        const withdrawals = withdrawalsResult.rows;

        for (const withdrawal of withdrawals) {
          const { id: withdrawalId, ...withdrawalData } = withdrawal;
          await mongoPrisma.withdrawal.create({
            data: {
              ...withdrawalData,
              userId: newUser.id
            }
          });
          stats.withdrawals++;
        }

        // Migrate user's invoices and payments
        const invoicesQuery = `
          SELECT "id", "title", "description", "currency", "amount", "status", "createdAt", "updatedAt"
          FROM "Invoice" WHERE "userId" = $1
        `;
        const invoicesResult = await postgresClient.query(invoicesQuery, [user.id]);
        const invoices = invoicesResult.rows;

        for (const invoice of invoices) {
          const { id: invoiceId, ...invoiceData } = invoice;

          const newInvoice = await mongoPrisma.invoice.create({
            data: {
              ...invoiceData,
              userId: newUser.id
            }
          });
          stats.invoices++;

          // Migrate payments for this invoice
          const paymentsQuery = `
            SELECT "id", "telegramId", "transactionId", "productName", "itemId", "amount", "status", "createdAt"
            FROM "Payment" WHERE "invoiceId" = $1
          `;
          const paymentsResult = await postgresClient.query(paymentsQuery, [invoice.id]);
          const payments = paymentsResult.rows;

          for (const payment of payments) {
            const { id: paymentId, ...paymentData } = payment;
            await mongoPrisma.payment.create({
              data: {
                ...paymentData,
                userId: newUser.id,
                invoiceId: newInvoice.id
              }
            });
            stats.payments++;
          }
        }

      } catch (error) {
        console.error(`❌ Failed to migrate user ${user.telegramId}:`, error.message);
      }
    }

    // Migration complete
    console.log('\n🎉 Migration Complete!');
    console.log('====================');
    console.log(`✅ Users migrated: ${stats.users}`);
    console.log(`✅ Purchases migrated: ${stats.purchases}`);
    console.log(`✅ Invoices migrated: ${stats.invoices}`);
    console.log(`✅ Payments migrated: ${stats.payments}`);
    console.log(`✅ Withdrawals migrated: ${stats.withdrawals}`);
    console.log(`📊 Total records migrated: ${Object.values(stats).reduce((a, b) => a + b, 0)}`);

    // Verify migration
    console.log('\n🔍 Verifying Migration...');
    const mongoUserCount = await mongoPrisma.user.count();
    const mongoPurchaseCount = await mongoPrisma.purchase.count();
    const mongoInvoiceCount = await mongoPrisma.invoice.count();
    const mongoPaymentCount = await mongoPrisma.payment.count();
    const mongoWithdrawalCount = await mongoPrisma.withdrawal.count();

    console.log(`MongoDB Users: ${mongoUserCount}`);
    console.log(`MongoDB Purchases: ${mongoPurchaseCount}`);
    console.log(`MongoDB Invoices: ${mongoInvoiceCount}`);
    console.log(`MongoDB Payments: ${mongoPaymentCount}`);
    console.log(`MongoDB Withdrawals: ${mongoWithdrawalCount}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });

    // Provide troubleshooting
    console.log('\n💡 Troubleshooting:');
    console.log('1. Ensure both DATABASE_URL and POSTGRES_URL are set in .env');
    console.log('2. Verify PostgreSQL database is accessible');
    console.log('3. Check MongoDB Atlas connection');
    console.log('4. Ensure no duplicate data exists in MongoDB');

  } finally {
    if (postgresClient) {
      await postgresClient.end();
      console.log('\n🔌 Disconnected from PostgreSQL');
    }
    if (mongoPrisma) {
      await mongoPrisma.$disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run migration
migrateData().catch(console.error);