// Comprehensive test for provider dashboard issues
const puppeteer = require('puppeteer');

async function testProviderDashboard() {
  console.log('🔍 Testing Provider Dashboard Issues...\n');

  let browser;
  try {
    // Check if puppeteer is installed
    try {
      browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } catch (error) {
      console.log('❌ Puppeteer not available, installing...');
      require('child_process').execSync('npm install puppeteer', { stdio: 'inherit' });
      console.log('✅ Puppeteer installed, retrying...');
      browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log('🌐 Browser Console:', msg.type(), msg.text());
    });
    
    // Enable error logging
    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });

    // Test 1: Check if main login page loads
    console.log('1. Testing main login page...');
    const loginResponse = await page.goto('http://localhost:4000/main-login');
    console.log(`   Status: ${loginResponse.status()}`);
    
    if (loginResponse.status() !== 200) {
      throw new Error('Login page not accessible');
    }

    // Test 2: Look for provider login option
    console.log('2. Looking for provider login option...');
    const providerLoginExists = await page.$eval('body', body => 
      body.textContent.toLowerCase().includes('provider') || 
      body.textContent.toLowerCase().includes('carrier')
    );
    console.log(`   Provider login option found: ${providerLoginExists}`);

    // Test 3: Check if we can access dashboard directly (should redirect to login)
    console.log('3. Testing dashboard access without login...');
    const dashboardResponse = await page.goto('http://localhost:4000/dashboard');
    console.log(`   Dashboard response status: ${dashboardResponse.status()}`);
    console.log(`   Current URL: ${page.url()}`);

    // Test 4: Check if logout endpoint exists
    console.log('4. Testing logout endpoint...');
    const logoutResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/providers/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        return {
          status: response.status,
          ok: response.ok,
          text: await response.text()
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    console.log('   Logout endpoint test:', logoutResponse);

    // Test 5: Check if accept/reject endpoints exist
    console.log('5. Testing accept/reject endpoints...');
    const acceptResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/providers/requests/test123/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        return {
          status: response.status,
          ok: response.ok
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    console.log('   Accept endpoint test:', acceptResponse);

    console.log('\n✅ Dashboard testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available, if not provide alternative
if (require('fs').existsSync('node_modules/puppeteer')) {
  testProviderDashboard();
} else {
  console.log('📋 Manual testing instructions:');
  console.log('1. Open http://localhost:4000/main-login in browser');
  console.log('2. Look for provider/carrier login option');
  console.log('3. Try to access http://localhost:4000/dashboard');
  console.log('4. Open browser console and test:');
  console.log('   fetch("/api/providers/logout", {method:"POST"})');
  console.log('5. Test accept endpoint:');
  console.log('   fetch("/api/providers/requests/test/accept", {method:"POST"})');
  
  // Simple endpoint test
  console.log('\n🔧 Testing endpoints from Node.js...');
  const testEndpoints = async () => {
    try {
      // Install node-fetch if needed
      let fetch;
      try {
        fetch = require('node-fetch');
      } catch (e) {
        console.log('Installing node-fetch...');
        require('child_process').execSync('npm install node-fetch@2', { stdio: 'inherit' });
        fetch = require('node-fetch');
      }

      const tests = [
        { name: 'Main Login', url: 'http://localhost:4000/main-login' },
        { name: 'Dashboard', url: 'http://localhost:4000/dashboard' },
        { name: 'Logout API', url: 'http://localhost:4000/api/providers/logout', method: 'POST' },
        { name: 'Accept API', url: 'http://localhost:4000/api/providers/requests/test/accept', method: 'POST' }
      ];

      for (const test of tests) {
        try {
          const response = await fetch(test.url, { 
            method: test.method || 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          console.log(`${test.name}: ${response.status} ${response.statusText}`);
        } catch (error) {
          console.log(`${test.name}: ERROR - ${error.message}`);
        }
      }
    } catch (error) {
      console.log('Endpoint testing failed:', error.message);
    }
  };

  testEndpoints();
}
