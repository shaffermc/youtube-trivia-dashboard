# YouTube Live Trivia Dashboard
This project is a real-time trivia game system that runs directly inside a YouTube Live Stream chatroom.
Streamers can host interactive trivia sessions where viewers answer questions in the live chat, earn points, and compete on a leaderboard — all managed through a full-stack web dashboard.
The application is built as a MERN stack web app (MongoDB, Express, React, Node.js) and integrates with the YouTube Live Chat API for real-time gameplay.

## Features
Live Trivia Game Engine
Automatically posts trivia questions into a YouTube livestream chat
Accepts viewer responses and awards points for correct answers
Adjustable timing between questions
Start/stop game controls from the dashboard

## Web Dashboard Controls
The React dashboard provides tools for stream owners to manage the game:
Start / Stop trivia sessions
Configure delay between questions
View current game status in real time

## Question Management
Add new trivia questions
Delete or edit existing questions
Store questions permanently in MongoDB

## Leaderboard & Scores
Tracks scores across sessions
Displays top scoring users
Shows competition rankings for viewers

## YouTube API Integration
Fetches the current liveChatId automatically
Uses OAuth authentication to connect to the stream chat
Sends messages directly into the active livestream chatroom

## Tech Stack
Component	Technology
Frontend	React + Vite
Backend	Node.js + Express
Database	MongoDB
Real-Time	YouTube Live Chat API
Hosting	VPS deployment with PM2 + Nginx (optional)

## How It Works
The streamer authenticates using the YouTube API
The backend retrieves the active livestream chat ID
Trivia questions are posted into the chat on a timer
Viewer responses are monitored and scored
The dashboard updates live with game controls and leaderboard data

## Current Status
This project is actively being developed and improved.
Planned enhancements include:
Multi-channel support (any streamer can use it)
Improved UI/UX for public release
More advanced question types and scoring modes

## Screenshots / Demo
(Coming soon)
📄 License

(Add your preferred license here — MIT is common
