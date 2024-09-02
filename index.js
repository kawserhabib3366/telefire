const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Load environment variables from a .env file
require('dotenv').config();

// Retrieve the bot token from environment variables
const botToken = process.env.TELEGRAM_BOT_TOKEN;

// Create an instance of the Telegram bot
const bot = new TelegramBot(botToken);
const app = express();

// URL of your Blogger post where the JSON is embedded
const BLOGGER_POST_URL = "https://khbfy.blogspot.com/p/movie.html"; // Replace with your actual Blogger post URL

// Set webhook URL dynamically based on Render's domain (update with your Render service name)
const webhookUrl = `https://telefire.onrender.com/bot${botToken}`;
bot.setWebHook(webhookUrl);

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to receive updates from Telegram
app.post(`/bot${botToken}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Function to fetch movie data from the Blogger post
async function fetchMovieData() {
  try {
    const response = await axios.get(BLOGGER_POST_URL);
    const htmlContent = response.data;

    // Extract JSON from the <script> tag with id="movie-data"
    const scriptTagStart = '<script id="movie-data" type="application/json">';
    const startIndex = htmlContent.indexOf(scriptTagStart);

    if (startIndex === -1) {
      throw new Error("Could not find JSON data in the specified script tag.");
