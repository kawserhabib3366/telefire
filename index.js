const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Load environment variables from a .env file
require('dotenv').config();

// Retrieve the bot token from environment variables
const botToken = process.env.TELEGRAM_BOT_TOKEN;

// Create an instance of the Telegram bot with polling enabled
const bot = new TelegramBot(botToken, { polling: true });

// URL of your Blogger post where the JSON is embedded
const BLOGGER_POST_URL = "https://khbfy.blogspot.com/p/movie.html"; // Replace with your actual Blogger post URL

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
    }

    const jsonStartIndex = htmlContent.indexOf('{', startIndex);
    const jsonEndIndex = htmlContent.indexOf('</script>', jsonStartIndex);
    const jsonString = htmlContent.substring(jsonStartIndex, jsonEndIndex).trim();

    // Parse JSON string into JavaScript object
    const movieData = JSON.parse(jsonString);
    return movieData.movies || {};
  } catch (error) {
    console.error(`Error fetching or parsing movie data: ${error.message}`);
    return {};
  }
}

// Handler to print the file ID of any document or video sent to the bot
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

// Handler for the /start command
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

console.log('Telegram bot is running with polling...');
