const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config(); // Load environment variables

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(botToken);
const app = express();

// Your Blogger post URL
const BLOGGER_POST_URL = "https://khbfy.blogspot.com/p/movie.html"; 

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

    const scriptTagStart = '<script id="movie-data" type="application/json">';
    const startIndex = htmlContent.indexOf(scriptTagStart);

    if (startIndex === -1) {
      throw new Error("Could not find JSON data in the specified script tag.");
    }

    const jsonStartIndex = htmlContent.indexOf('{', startIndex);
    const jsonEndIndex = htmlContent.indexOf('</script>', jsonStartIndex);
    const jsonString = htmlContent.substring(jsonStartIndex, jsonEndIndex).trim();

    const movieData = JSON.parse(jsonString);
    return movieData.movies || {};
  } catch (error) {
    console.error(`Error fetching or parsing movie data: ${error.message}`);
    return {};
  }
}

// Handlers for bot commands and messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (msg.document) {  // If a document is sent
    const fileId = msg.document.file_id;
    bot.sendMessage(chatId, `Document file ID: ${fileId}`);
    console.log(`Document file ID: ${fileId}`);
  } else if (msg.video) {  // If a video is sent
    const fileId = msg.video.file_id;
    bot.sendMessage(chatId, `Video file ID: ${fileId}`);
    console.log(`Video file ID: ${fileId}`);
  }
});

bot.onText(/\/start (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const movieId = match[1].toLowerCase();  // Extract movie ID from the command

  const movies = await fetchMovieData();  // Fetch movie data dynamically

  if (movies[movieId]) {
    const movieFileId = movies[movieId];
    bot.sendDocument(chatId, movieFileId);  // Send the file without any link
  } else {
    bot.sendMessage(chatId, `Sorry, the movie ID '${movieId}' is not available.`);
  }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot server is running on port ${PORT}`);
});
