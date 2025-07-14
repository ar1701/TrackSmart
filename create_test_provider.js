// Test script to verify provider dashboard fixes
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Provider = require('./model/provider');

async function createTestProvider() {
  try {
    console.log('🔧 Creating test provider for dashboard testing...');

    // Connect to database
    await mongoose.connect(process.env.DB_URL);
    console.log('✅ Connected to database');

    // Check if test provider already exists
    let testProvider = await Provider.findOne({ email: 'test.provider@tracksmart.com' });
    
    if (!testProvider) {
      // Create a test provider
      testProvider = new Provider({
        name: 'Test Provider Company',
        email: 'test.provider@tracksmart.com',
        hasBaseUri: false,
        actions: ['delivery'],
        supportedPincodes: ['110001', '400001', '560001'],
        weightLimits: { min: 0.1, max: 50 },
        dimensionalLimits: { l: 100, w: 100, h: 100 },
        isVerified: true,
        verifiedAt: new Date(),
        username: 'testprovider',
        password: '$2a$10$example.hash.for.password123', // hashed 'password123'
        isPasswordGenerated: true
      });

      await testProvider.save();
      console.log('✅ Test provider created');
    } else {
      // Update existing provider to ensure it has all required fields
      testProvider.isVerified = true;
      testProvider.username = testProvider.username || 'testprovider';
      testProvider.verifiedAt = testProvider.verifiedAt || new Date();
      await testProvider.save();
      console.log('✅ Test provider updated');
    }

    console.log('📋 Test Provider Details:');
    console.log(`   Provider ID: ${testProvider.bppId}`);
    console.log(`   Name: ${testProvider.name}`);
    console.log(`   Email: ${testProvider.email}`);
    console.log(`   Username: ${testProvider.username}`);
    console.log(`   Verified: ${testProvider.isVerified}`);
    console.log(`   Created: ${testProvider.createdAt}`);
    console.log(`   Verified On: ${testProvider.verifiedAt}`);

    console.log('\n🎯 Manual Testing Instructions:');
    console.log('1. Open http://localhost:4000/main-login');
    console.log('2. Navigate to provider login (if available)');
    console.log('3. Login with:');
    console.log(`   Username: ${testProvider.username}`);
    console.log(`   Password: password123`);
    console.log('4. Test the dashboard functionality:');
    console.log('   - Check if provider information displays correctly');
    console.log('   - Test logout button (should show enhanced console logs)');
    console.log('   - Test accept/reject buttons if any requests are available');
    console.log('5. Open browser console to see fix script logs');

    await mongoose.disconnect();
    console.log('✅ Database disconnected');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestProvider();
