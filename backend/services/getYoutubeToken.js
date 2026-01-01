// getYoutubeToken.js
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { google } = require("googleapis");

// Adjust if client_secrets.json is elsewhere
const credentialsPath = path.join(__dirname, "..", "client_secrets.json");
const creds = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));

const { client_id, client_secret, redirect_uris } = creds.installed;
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

// Scopes needed for reading & sending live chat messages
const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.force-ssl",
];

function getAccessToken() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline", // needed for refresh_token
    prompt: "consent",      // force showing consent to get refresh_token again
    scope: SCOPES,
  });

  console.log("Authorize this app by visiting this url:\n");
  console.log(authUrl);
  console.log("\nThen paste the code you get here and press Enter.\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Enter the code from that page: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code.trim(), (err, token) => {
      if (err) {
        console.error("Error retrieving access token", err);
        return;
      }
      console.log("\nTokens received:\n");
      console.log(JSON.stringify(token, null, 2));
      console.log(
        "\nCopy the `refresh_token` value above and put it in your .env as YT_REFRESH_TOKEN.\n"
      );
    });
  });
}

getAccessToken();
