// backend/services/youtubeClient.js
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

let youtubeClient = null;

async function getYouTubeClient() {
  if (youtubeClient) return youtubeClient;

  // Adjust this path if your client_secrets.json is elsewhere
  const credentialsPath = path.join(__dirname, "..", "client_secrets.json");
  const creds = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));

  const { client_id, client_secret, redirect_uris } = creds.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // You need to put your refresh token in .env as YT_REFRESH_TOKEN
  oAuth2Client.setCredentials({
    refresh_token: process.env.YT_REFRESH_TOKEN,
  });

  youtubeClient = google.youtube({
    version: "v3",
    auth: oAuth2Client,
  });

  return youtubeClient;
}

async function listChatMessages(liveChatId, pageToken) {
  const yt = await getYouTubeClient();

  const res = await yt.liveChatMessages.list({
    liveChatId,
    part: ["id", "snippet", "authorDetails"],
    pageToken,
    maxResults: 50,
  });

  const items = res.data.items || [];

  const messages = items.map((m) => ({
    id: m.id,
    author: m.authorDetails?.displayName,
    text: m.snippet?.displayMessage,
    publishedAt: m.snippet?.publishedAt,
  }));

  return {
    messages,
    nextPageToken: res.data.nextPageToken || null,
    pollingIntervalMillis: res.data.pollingIntervalMillis || 0,
  };
}

module.exports = { listChatMessages };
