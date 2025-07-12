require('dotenv').config();
const mongoose = require('mongoose');
const Provider = require('./model/provider');
const connectDB = require('./utils/connectToDB');

async function checkRejectedProviders() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Check all providers
    const allProviders = await Provider.find({});
    console.log('\n=== ALL PROVIDERS ===');
    allProviders.forEach(p => {
      console.log(`${p.bppId}: ${p.name}`);
      console.log(`  - isVerified: ${p.isVerified}`);
      console.log(`  - rejectedAt: ${p.rejectedAt}`);
      console.log(`  - rejectionReason: ${p.rejectionReason}`);
      console.log(`  - verifiedAt: ${p.verifiedAt}`);
      console.log('---');
    });

    // Check rejected providers specifically
    const rejectedProviders = await Provider.find({
      isVerified: false,
      rejectedAt: { $exists: true }
    });
    console.log('\n=== REJECTED PROVIDERS ===');
    console.log('Count:', rejectedProviders.length);
    rejectedProviders.forEach(p => {
      console.log(`${p.bppId}: ${p.name} - ${p.rejectionReason}`);
    });

    // Check onboarding requests
    const onboardingProviders = await Provider.find({
      isVerified: false,
      rejectedAt: { $exists: false }
    });
    console.log('\n=== ONBOARDING REQUESTS ===');
    console.log('Count:', onboardingProviders.length);
    onboardingProviders.forEach(p => {
      console.log(`${p.bppId}: ${p.name}`);
    });

    // Check verified providers
    const verifiedProviders = await Provider.find({ isVerified: true });
    console.log('\n=== VERIFIED PROVIDERS ===');
    console.log('Count:', verifiedProviders.length);
    verifiedProviders.forEach(p => {
      console.log(`${p.bppId}: ${p.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRejectedProviders();
