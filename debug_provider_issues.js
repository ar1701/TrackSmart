const express = require('express');
const session = require('express-session');
const app = require('./app');

// Test the provider dashboard endpoints
async function testProviderEndpoints() {
  console.log('Testing Provider Dashboard Issues...\n');

  // Start the server
  const PORT = 3001;
  const server = app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });

  try {
    // Test 1: Check if logout endpoint exists
    console.log('1. Testing logout endpoint...');
    const logoutResponse = await fetch(`http://localhost:${PORT}/api/providers/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`   Logout endpoint status: ${logoutResponse.status}`);
    
    // Test 2: Check accept/reject endpoints (without auth - should get 401)
    console.log('\n2. Testing accept/reject endpoints...');
    const acceptResponse = await fetch(`http://localhost:${PORT}/api/providers/requests/test123/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`   Accept endpoint status: ${acceptResponse.status}`);
    
    const rejectResponse = await fetch(`http://localhost:${PORT}/api/providers/requests/test123/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`   Reject endpoint status: ${rejectResponse.status}`);

    // Test 3: Check if dashboard route exists
    console.log('\n3. Testing dashboard route...');
    const dashboardResponse = await fetch(`http://localhost:${PORT}/dashboard`);
    console.log(`   Dashboard route status: ${dashboardResponse.status}`);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    server.close();
  }
}

// Check if fetch is available (Node 18+) or use node-fetch
if (typeof fetch === 'undefined') {
  console.log('Fetch not available, installing node-fetch...');
  require('child_process').execSync('npm install node-fetch@2', { stdio: 'inherit' });
  global.fetch = require('node-fetch');
}

testProviderEndpoints();
