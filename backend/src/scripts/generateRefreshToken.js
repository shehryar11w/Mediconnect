const { google } = require("googleapis");
const path = require("path");

// Load credentials
const credentials = require(
    path.join(process.cwd(), "src/services/credentials.json"),
);

const oauth2Client = new google.auth.OAuth2(
    credentials.installed.client_id,
    credentials.installed.client_secret,
    "http://localhost",
);

// Generate the URL for user consent
const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://mail.google.com/"],
});

console.log("Authorize this app by visiting this URL:", authUrl);

// After getting the authorization code from the URL, use this function
async function getRefreshToken(code) {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("Refresh Token:", tokens.refresh_token);
    return tokens.refresh_token;
}

// Export the function to use in the terminal
module.exports = { getRefreshToken };
