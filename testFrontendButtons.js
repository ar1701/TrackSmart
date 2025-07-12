// Frontend Accept/Reject Button Test Script
const puppeteer = require("puppeteer");

async function testFrontendButtons() {
  let browser;
  try {
    console.log("🎯 Testing Frontend Accept/Reject Buttons...\n");

    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      devtools: true, // Open dev tools
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Enable console logging
    page.on("console", (msg) => console.log("BROWSER:", msg.text()));
    page.on("pageerror", (error) => console.log("PAGE ERROR:", error.message));

    console.log("1️⃣ Navigating to login page...");
    await page.goto("http://localhost:4000/main-login");

    console.log("2️⃣ Clicking provider login...");
    await page.click("button[onclick=\"showLoginForm('provider')\"]");

    // Wait for modal to appear
    await page.waitForSelector("#loginModal", { visible: true });

    console.log("3️⃣ Entering provider credentials...");
    await page.type("#username", "fasttrack_TS000018");
    await page.type("#password", "5t38uw8ju8UXXB");

    console.log("4️⃣ Submitting login form...");
    await page.click("#loginBtn");

    // Wait for dashboard to load
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    console.log("5️⃣ Checking if dashboard loaded...");
    const currentUrl = page.url();
    console.log("Current URL:", currentUrl);

    if (currentUrl.includes("provider")) {
      console.log("✅ Successfully logged in to provider dashboard");

      // Check for accept/reject buttons
      console.log("6️⃣ Looking for accept/reject buttons...");
      const acceptButtons = await page.$$(
        'button[onclick*="handleRequest"][onclick*="accept"]'
      );
      const rejectButtons = await page.$$(
        'button[onclick*="handleRequest"][onclick*="reject"]'
      );

      console.log(`Found ${acceptButtons.length} accept buttons`);
      console.log(`Found ${rejectButtons.length} reject buttons`);

      if (acceptButtons.length > 0) {
        console.log("7️⃣ Testing accept button click...");

        // Click the first accept button
        await acceptButtons[0].click();

        // Wait a bit and check for modal
        await page.waitForTimeout(1000);

        const acceptModal = await page.$("#acceptModal.show");
        if (acceptModal) {
          console.log("✅ Accept modal opened successfully!");

          // Test entering cost and confirming
          await page.type("#actualCost", "500");
          await page.click("#confirmAccept");

          console.log("✅ Accept functionality tested");
        } else {
          console.log("❌ Accept modal did not open");
        }
      }

      // Keep browser open for manual testing
      console.log("\n🔍 Browser kept open for manual testing...");
      console.log("Press Ctrl+C to close when done testing");

      // Wait indefinitely
      await new Promise(() => {});
    } else {
      console.log("❌ Failed to reach provider dashboard");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available
try {
  require("puppeteer");
  testFrontendButtons();
} catch (error) {
  console.log("❌ Puppeteer not available. Installing...");
  console.log("Run: npm install puppeteer");
  console.log("\nAlternatively, test manually:");
  console.log("1. Open http://localhost:4000/main-login");
  console.log('2. Click "Login as Provider"');
  console.log("3. Enter: fasttrack_TS000018 / 5t38uw8ju8UXXB");
  console.log("4. Test accept/reject buttons");
  console.log("5. Check browser console for errors (F12)");
}
