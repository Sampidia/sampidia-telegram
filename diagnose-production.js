#!/usr/bin/env node

/**
 * Production Diagnostic Script for SamPidia Telegram App
 * This script helps identify issues with the balance API in production
 */

const https = require('https');
const http = require('http');

// Configuration
const PRODUCTION_URL = 'https://sampidia-telegram.vercel.app'; // Update with your actual production URL
const LOCAL_URL = 'http://localhost:3000';

const TEST_USERS = [
  { id: '2111112', name: 'Test User', expectedBalance: 50 },
  { id: '21155555', name: 'Sam55555', expectedBalance: 100 },
  { id: '99999999', name: 'New User', expectedBalance: 0 }
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            responseTime,
            success: true
          });
        } catch (parseError) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            responseTime,
            success: false,
            parseError: parseError.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      reject({
        error: error.message,
        responseTime,
        success: false
      });
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        responseTime: Date.now() - startTime,
        success: false
      });
    });
  });
}

async function testEndpoint(baseUrl, userId, expectedBalance, userName) {
  const url = `${baseUrl}/api/user-balance?userId=${userId}`;
  console.log(`\n🧪 Testing: ${userName} (${userId})`);
  console.log(`📍 URL: ${url}`);
  console.log(`📊 Expected Balance: ${expectedBalance}`);
  
  try {
    const result = await makeRequest(url);
    
    console.log(`⏱️  Response Time: ${result.responseTime}ms`);
    console.log(`📈 Status Code: ${result.status}`);
    
    if (result.success && result.data) {
      console.log(`💰 Actual Balance: ${result.data.userBalance}`);
      console.log(`📍 Data Source: ${result.data.dataSource || 'unknown'}`);
      
      if (result.data.error) {
        console.log(`⚠️  Warning: ${result.data.error}`);
      }
      
      if (result.headers['x-fallback']) {
        console.log(`🔄 Fallback Mode: ${result.headers['x-fallback']}`);
      }
      
      const balanceMatch = result.data.userBalance === expectedBalance;
      console.log(`✅ Balance Match: ${balanceMatch ? 'YES' : 'NO'}`);
      
      if (!balanceMatch) {
        console.log(`❌ Expected: ${expectedBalance}, Got: ${result.data.userBalance}`);
      }
      
      return {
        success: true,
        balanceMatch,
        responseTime: result.responseTime,
        dataSource: result.data.dataSource,
        actualBalance: result.data.userBalance,
        status: result.status
      };
    } else {
      console.log(`❌ Failed to parse response or no data`);
      console.log(`📄 Raw Response:`, result.data);
      
      return {
        success: false,
        error: result.parseError || 'No data received',
        responseTime: result.responseTime,
        status: result.status
      };
    }
  } catch (error) {
    console.log(`❌ Request Failed: ${error.error}`);
    console.log(`⏱️  Response Time: ${error.responseTime}ms`);
    
    return {
      success: false,
      error: error.error,
      responseTime: error.responseTime
    };
  }
}

async function runDiagnostics() {
  console.log('🚀 SamPidia Production Diagnostics');
  console.log('=====================================');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 Production URL: ${PRODUCTION_URL}`);
  console.log(`🏠 Local URL: ${LOCAL_URL}`);
  
  const results = {
    production: [],
    local: []
  };
  
  // Test Production
  console.log('\n🌐 TESTING PRODUCTION ENVIRONMENT');
  console.log('=====================================');
  
  for (const user of TEST_USERS) {
    const result = await testEndpoint(PRODUCTION_URL, user.id, user.expectedBalance, user.name);
    results.production.push({ user, result });
    
    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test Local (if available)
  console.log('\n🏠 TESTING LOCAL ENVIRONMENT');
  console.log('=====================================');
  
  for (const user of TEST_USERS) {
    try {
      const result = await testEndpoint(LOCAL_URL, user.id, user.expectedBalance, user.name);
      results.local.push({ user, result });
    } catch (error) {
      console.log(`⚠️  Local server not available for ${user.name}`);
      results.local.push({ user, result: { success: false, error: 'Local server not available' } });
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n📋 DIAGNOSTIC SUMMARY');
  console.log('=====================================');
  
  const prodSuccessful = results.production.filter(r => r.result.success).length;
  const prodBalanceMatch = results.production.filter(r => r.result.balanceMatch).length;
  const localSuccessful = results.local.filter(r => r.result.success).length;
  const localBalanceMatch = results.local.filter(r => r.result.balanceMatch).length;
  
  console.log(`🌐 Production: ${prodSuccessful}/${TEST_USERS.length} successful, ${prodBalanceMatch}/${TEST_USERS.length} correct balances`);
  console.log(`🏠 Local: ${localSuccessful}/${TEST_USERS.length} successful, ${localBalanceMatch}/${TEST_USERS.length} correct balances`);
  
  // Identify issues
  console.log('\n🔍 IDENTIFIED ISSUES');
  console.log('=====================================');
  
  const prodIssues = results.production.filter(r => !r.result.success || !r.result.balanceMatch);
  const localIssues = results.local.filter(r => !r.result.success || !r.result.balanceMatch);
  
  if (prodIssues.length > 0) {
    console.log('🌐 Production Issues:');
    prodIssues.forEach(({ user, result }) => {
      console.log(`  - ${user.name} (${user.id}): ${result.error || 'Balance mismatch'}`);
      if (result.dataSource) {
        console.log(`    Data Source: ${result.dataSource}`);
      }
    });
  }
  
  if (localIssues.length > 0) {
    console.log('🏠 Local Issues:');
    localIssues.forEach(({ user, result }) => {
      console.log(`  - ${user.name} (${user.id}): ${result.error || 'Balance mismatch'}`);
    });
  }
  
  if (prodIssues.length === 0 && localIssues.length === 0) {
    console.log('✅ No issues detected! All tests passed.');
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('=====================================');
  
  if (prodIssues.length > 0) {
    console.log('🌐 For Production Issues:');
    console.log('  1. Check Vercel deployment logs');
    console.log('  2. Verify DATABASE_URL environment variable');
    console.log('  3. Test database connectivity from production');
    console.log('  4. Check Prisma Accelerate connection');
    console.log('  5. Verify all environment variables are set correctly');
  }
  
  if (results.production.some(r => r.result.dataSource === 'fallback')) {
    console.log('🔄 Fallback mode detected - database connection issues likely');
  }
  
  const avgProdTime = results.production
    .filter(r => r.result.responseTime)
    .reduce((sum, r) => sum + r.result.responseTime, 0) / results.production.length;
    
  if (avgProdTime > 5000) {
    console.log(`⏱️  High response times detected (avg: ${avgProdTime.toFixed(0)}ms) - consider optimizing database queries`);
  }
  
  console.log('\n🏁 Diagnostics Complete');
}

// Run diagnostics
runDiagnostics().catch(console.error);