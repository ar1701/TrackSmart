// Comprehensive validation of provider dashboard fixes
const express = require('express');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Provider = require('./model/provider');

const app = express();

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session setup
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

async function startValidationServer() {
  try {
    // Connect to database
    await mongoose.connect(process.env.DB_URL);
    console.log('✅ Connected to database');

    // Get test provider
    const testProvider = await Provider.findOne({ email: 'test.provider@tracksmart.com' });
    if (!testProvider) {
      throw new Error('Test provider not found. Run create_test_provider.js first');
    }

    // Test dashboard route with proper provider data
    app.get('/test-dashboard', async (req, res) => {
      try {
        // Simulate authenticated session
        req.session.user = {
          type: 'provider',
          providerId: testProvider._id,
          ...testProvider.toObject()
        };

        const stats = {
          totalRequests: 3,
          pendingRequests: 2,
          acceptedRequests: 1,
          rejectedRequests: 0,
          totalRevenue: 1500
        };

        // Mock requests with proper structure
        const testRequests = [
          {
            _id: 'req1',
            requestId: 'REQ001',
            status: 'pending',
            shipmentId: {
              sender: { pincode: '110001' },
              receiver: { pincode: '400001' }
            },
            estimatedCost: 1200,
            createdAt: new Date(),
            source: 'Delhi',
            destination: 'Mumbai'
          },
          {
            _id: 'req2',
            requestId: 'REQ002', 
            status: 'pending',
            shipmentId: {
              sender: { pincode: '560001' },
              receiver: { pincode: '400001' }
            },
            estimatedCost: 800,
            createdAt: new Date(),
            source: 'Bangalore',
            destination: 'Mumbai'
          }
        ];

        res.render('providerPage/dashboard', {
          title: 'Provider Dashboard - Test',
          provider: testProvider,
          requests: testRequests,
          pendingRequests: testRequests,
          stats: stats
        });

      } catch (error) {
        console.error('Dashboard render error:', error);
        res.status(500).send('Dashboard error: ' + error.message);
      }
    });

    // Test logout endpoint
    app.post('/api/providers/logout', (req, res) => {
      console.log('🔄 Logout endpoint called');
      req.session.destroy((err) => {
        if (err) {
          console.error('Logout error:', err);
          return res.status(500).json({ success: false, message: 'Logout error' });
        }
        console.log('✅ Session destroyed successfully');
        res.json({ success: true, message: 'Logged out successfully' });
      });
    });

    // Test accept/reject endpoints
    app.post('/api/providers/requests/:requestId/accept', (req, res) => {
      console.log('🔄 Accept endpoint called:', req.params.requestId, req.body);
      
      if (!req.body.actualCost) {
        return res.status(400).json({ 
          success: false, 
          message: 'Actual cost is required' 
        });
      }

      res.json({
        success: true,
        message: 'Request accepted successfully',
        data: { 
          request: { 
            id: req.params.requestId, 
            status: 'accepted',
            actualCost: req.body.actualCost
          } 
        }
      });
    });

    app.post('/api/providers/requests/:requestId/reject', (req, res) => {
      console.log('🔄 Reject endpoint called:', req.params.requestId, req.body);
      
      if (!req.body.rejectionReason) {
        return res.status(400).json({ 
          success: false, 
          message: 'Rejection reason is required' 
        });
      }

      res.json({
        success: true,
        message: 'Request rejected successfully',
        data: { 
          request: { 
            id: req.params.requestId, 
            status: 'rejected',
            rejectionReason: req.body.rejectionReason
          } 
        }
      });
    });

    const PORT = 3003;
    app.listen(PORT, () => {
      console.log(`\n🎯 Validation server running on http://localhost:${PORT}`);
      console.log(`\n📋 Testing Instructions:`);
      console.log(`1. Open: http://localhost:${PORT}/test-dashboard`);
      console.log(`2. Open browser console to see fix script logs`);
      console.log(`3. Test the following:`);
      console.log(`   ✓ Check if provider info displays correctly (no "undefined" values)`);
      console.log(`   ✓ Click logout button - should show enhanced logs and redirect`);
      console.log(`   ✓ Click accept/reject buttons - should work with prompts or modals`);
      console.log(`4. Look for these console messages:`);
      console.log(`   📦 "Provider Dashboard Enhancement Script Loaded"`);
      console.log(`   🔧 "Applying provider dashboard fixes..."`);
      console.log(`   ✅ "Logout function enhanced"`);
      console.log(`   ✅ "HandleRequest function enhanced"`);
      console.log(`\nPress Ctrl+C to stop the validation server`);
    });

  } catch (error) {
    console.error('❌ Validation server error:', error.message);
    process.exit(1);
  }
}

startValidationServer();
