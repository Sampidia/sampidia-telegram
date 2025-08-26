import nodemailer from 'nodemailer';
import 'dotenv/config';

// Test the current SMTP configuration
async function testSMTP() {
  console.log('🔧 Testing SMTP Configuration...\n');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false,
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });

  // Verify connection
  try {
    console.log('🔌 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.log('\n🔍 Troubleshooting steps:');
    console.log('1. Check if SMTP_HOST is accessible');
    console.log('2. Verify SMTP_USER and SMTP_PASS are correct');
    console.log('3. Ensure port', process.env.SMTP_PORT, 'is not blocked');
    console.log('4. Check if SMTP server requires different security settings');
    return;
  }

  // Test email sending
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL_G || 'hr@sampidia.com.ng',
    subject: 'SMTP Test - SamPidia Withdrawal System 5',
    text: `SMTP Test Email New5

This is a test email to verify SMTP configuration.

Time: ${new Date().toISOString()}
Host: ${process.env.SMTP_HOST}
Port: ${process.env.SMTP_PORT}
User: ${process.env.SMTP_USER}

If you received this email, SMTP is working correctly!`
  };

  try {
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    console.error('Error details:', error);
  }

  transporter.close();
}

// Alternative: Test with Ethereal (fake SMTP for testing)
async function testWithEthereal() {
  console.log('\n🧪 Testing with Ethereal (fake SMTP)...');

  // Create test account
  const testAccount = await nodemailer.createTestAccount();
  console.log('Test account created:', testAccount.user, testAccount.pass);

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const mailOptions = {
    from: `"SamPidia Test" <${testAccount.user}>`,
    to: 'test@example.com',
    subject: 'Ethereal Test Email',
    text: 'This is a test email using Ethereal SMTP',
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Ethereal test email sent!');
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Ethereal test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting SMTP Tests...\n');

  // Environment variables are already loaded at the top

  console.log('📋 Current SMTP Configuration:');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);
  console.log('Admin Email:', process.env.ADMIN_EMAIL);
  console.log('Pass:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
  console.log('');

  try {
    await testSMTP();
  } catch (error) {
    console.error('SMTP test failed:', error.message);
  }

  try {
    await testWithEthereal();
  } catch (error) {
    console.error('Ethereal test failed:', error.message);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('Usage: node test-smtp.js');
  console.log('This script tests the SMTP configuration for SamPidia withdrawal system');
  process.exit(0);
}

runTests().catch(console.error);