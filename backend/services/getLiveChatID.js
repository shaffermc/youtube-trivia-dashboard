// getLiveChatId.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

async function main() {
  const credentialsPath = path.join(__dirname, "client_secrets.json");
  const creds = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));

  const { client_id, client_secret, redirect_uris } = creds.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  if (!process.env.YT_REFRESH_TOKEN) {
    console.error("Missing YT_REFRESH_TOKEN in .env");
    process.exit(1);
  }

  oAuth2Client.setCredentials({
    refresh_token: process.env.YT_REFRESH_TOKEN,
  });

  const youtube = google.youtube({
    version: "v3",
    auth: oAuth2Client,
  });

  try {
    const res = await youtube.liveBroadcasts.list({
      part: ["snippet", "contentDetails", "status"],
      broadcastStatus: "active",   // currently live
      broadcastType: "all",
      mine: true,                  // broadcasts owned by this account
    });

    const items = res.data.items || [];
    if (items.length === 0) {
      console.log("No active live broadcasts found for this account.");
      return;
    }

    console.log(`Found ${items.length} active broadcast(s):\n`);
    for (const b of items) {
      const title = b.snippet?.title;
      const id = b.id;
      const liveChatId = b.snippet?.liveChatId;
      console.log("Title:", title);
      console.log("Broadcast ID:", id);
      console.log("liveChatId:", liveChatId);
      console.log("-------------");
    }
  } catch (err) {
    console.error("Error listing broadcasts:");
    console.error(err.response?.data || err.message);
  }
}

main();
