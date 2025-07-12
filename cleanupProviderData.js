require('dotenv').config();
const mongoose = require('mongoose');
const Provider = require('./model/provider');
const connectDB = require('./utils/connectToDB');

async function cleanupProviderData() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find providers that have both verified and rejected states
    const inconsistentProviders = await Provider.find({
      isVerified: true,
      rejectedAt: { $exists: true }
    });

    console.log(`Found ${inconsistentProviders.length} providers with inconsistent states`);

    for (const provider of inconsistentProviders) {
      console.log(`Cleaning up ${provider.bppId}: ${provider.name}`);
      
      // Since they are marked as verified, remove rejection data
      provider.rejectedAt = undefined;
      provider.rejectionReason = undefined;
      
      await provider.save();
      console.log(`  - Removed rejection data, kept as verified`);
    }

    // Let's also create a proper rejected provider for testing
    const testRejected = await Provider.findOne({ name: 'FastTrack Logistics' });
    if (testRejected) {
      testRejected.rejectionReason = 'Test rejection - missing API documentation';
      testRejected.rejectedAt = new Date();
      testRejected.isVerified = false;
      testRejected.verifiedAt = undefined;
      testRejected.username = undefined;
      testRejected.password = undefined;
      testRejected.isPasswordGenerated = false;
      
      await testRejected.save();
      console.log(`Rejected ${testRejected.bppId}: ${testRejected.name} for testing`);
    }

    console.log('Cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupProviderData();
