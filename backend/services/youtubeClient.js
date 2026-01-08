// backend/services/youtubeClient.js
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

let youtubeClient = null;

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

  if (!process.env.YT_REFRESH_TOKEN) {
    throw new Error("YT_REFRESH_TOKEN is not set in .env");
  }

  oAuth2Client.setCredentials({
    refresh_token: process.env.YT_REFRESH_TOKEN,
  });

  youtubeClient = google.youtube({
    version: "v3",
    auth: oAuth2Client,
  });

  return youtubeClient;
}

async function listActiveBroadcasts() {
  const yt = await getYouTubeClient();

  const res = await yt.liveBroadcasts.list({
    part: ["snippet", "status", "contentDetails"],
    broadcastStatus: "active", // only currently-live broadcasts
    maxResults: 50,
  });

  const items = res.data.items || [];

  return items.map((b) => ({
    broadcastId: b.id,
    title: b.snippet?.title || "",
    liveChatId: b.snippet?.liveChatId || null,
    lifeCycleStatus: b.status?.lifeCycleStatus || null,
    publishedAt: b.snippet?.publishedAt || null,
  }));
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
    pollingIntervalMillis: res.data.pollingIntervalMillis || 2000,
  };
}

// 🔹 NEW: send a message to chat
async function sendChatMessage(liveChatId, messageText) {
  const yt = await getYouTubeClient();

  const res = await yt.liveChatMessages.insert({
    part: ["snippet"],
    requestBody: {
      snippet: {
        type: "textMessageEvent",
        liveChatId,
        textMessageDetails: {
          messageText,
        },
      },
    },
  });

  return res.data;
}

module.exports = {
  listChatMessages,
  sendChatMessage,
  listActiveBroadcasts,
};

