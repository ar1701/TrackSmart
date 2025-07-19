// Test script to validate the provider dashboard JavaScript
const fs = require("fs");
const path = require("path");

console.log("Checking provider dashboard for JavaScript issues...\n");

// Read the dashboard file
const dashboardPath =
  "/home/ayush/Desktop/GitHub Desktop/TrackSmart/views/providerPage/dashboard.ejs";
const content = fs.readFileSync(dashboardPath, "utf8");

// Extract JavaScript from between <script> tags
const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/g);

if (scriptMatch) {
  scriptMatch.forEach((script, index) => {
    console.log(`\n--- Script Block ${index + 1} ---`);

    // Remove script tags and extract JS content
    const jsContent = script.replace(/<\/?script[^>]*>/g, "");

    // Check for basic syntax issues
    const lines = jsContent.split("\n");
    let braceCount = 0;
    let parenCount = 0;
    let inString = false;
    let stringChar = "";

    lines.forEach((line, lineNum) => {
      // Simple syntax check
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const prevChar = i > 0 ? line[i - 1] : "";

        if (!inString) {
          if (char === '"' || char === "'" || char === "`") {
            inString = true;
            stringChar = char;
          } else if (char === "{") {
            braceCount++;
          } else if (char === "}") {
            braceCount--;
          } else if (char === "(") {
            parenCount++;
          } else if (char === ")") {
            parenCount--;
          }
        } else {
          if (char === stringChar && prevChar !== "\\") {
            inString = false;
            stringChar = "";
          }
        }
      }

      // Check for obvious issues
      if (line.includes("<%") && line.includes("%>")) {
        console.log(
          `   Line ${lineNum + 1}: EJS template code in JS: ${line.trim()}`
        );
      }
    });

    console.log(
      `   Brace balance: ${
        braceCount === 0 ? "OK" : "UNBALANCED (" + braceCount + ")"
      }`
    );
    console.log(
      `   Parentheses balance: ${
        parenCount === 0 ? "OK" : "UNBALANCED (" + parenCount + ")"
      }`
    );
  });
} else {
  console.log("No script blocks found");
}

// Check for specific function definitions
const functions = ["logoutProvider", "handleRequest", "processRequest"];
functions.forEach((func) => {
  if (content.includes(`function ${func}`)) {
    console.log(`✓ Function ${func} found`);
  } else {
    console.log(`✗ Function ${func} NOT found`);
  }
});

console.log("\n--- EJS Template Issues ---");
// Check for EJS syntax issues
const ejsPattern = /<%[\s\S]*?%>/g;
const ejsMatches = content.match(ejsPattern) || [];
console.log(`Found ${ejsMatches.length} EJS template blocks`);

// Check for unclosed EJS blocks
ejsMatches.forEach((match, index) => {
  if (!match.endsWith("%>")) {
    console.log(
      `⚠ Unclosed EJS block ${index + 1}: ${match.substring(0, 50)}...`
    );
  }
});
