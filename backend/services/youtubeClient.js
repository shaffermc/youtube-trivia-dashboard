// backend/services/youtubeClient.js
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

let youtubeClient = null;

// TODO: adjust paths/credentials as needed
async function getYouTubeClient() {
  if (youtubeClient) return youtubeClient;

  const credentialsPath = path.join(__dirname, "..", "client_secrets.json");
  const creds = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));

  const { client_id, client_secret, redirect_uris } = creds.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // For now assume you've already obtained and saved a refresh token
  // You can store it in an env var or a file
  oAuth2Client.setCredentials({
    refresh_token: process.env.YT_REFRESH_TOKEN,
  });

  youtubeClient = google.youtube({
    version: "v3",
    auth: oAuth2Client,
  });

  return youtubeClient;
}

async function sendChatMessage(liveChatId, message) {
  const yt = await getYouTubeClient();

  await yt.liveChatMessages.insert({
    part: ["snippet"],
    requestBody: {
      snippet: {
        type: "textMessageEvent",
        liveChatId,
        textMessageDetails: {
          messageText: message,
        },
      },
    },
  });
}

async function fetchNewMessages(liveChatId, pageToken) {
  const yt = await getYouTubeClient();

  const res = await yt.liveChatMessages.list({
    liveChatId,
    part: ["id", "snippet", "authorDetails"],
    pageToken,
  });

  const messages = res.data.items.map((m) => ({
    id: m.id,
    displayName: m.authorDetails.displayName,
    displayMessage: m.snippet.displayMessage,
    publishedAt: m.snippet.publishedAt,
  }));

  return {
    messages,
    nextPageToken: res.data.nextPageToken,
  };
}

module.exports = { getYouTubeClient, sendChatMessage, fetchNewMessages };
