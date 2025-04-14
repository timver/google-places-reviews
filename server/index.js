require('dotenv').config();
const express = require('express');
const https = require('https');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Read the certificates
const privateKey = fs.readFileSync(path.join(__dirname, 'private.key'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, 'certificate.crt'), 'utf8');
const credentials = { key: privateKey, cert: certificate };

// Google Places API URL
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

// Replace this with your own API key
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Serve static files (js, css, html, etc.) from the 'public' folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// CORS handling for your frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow any origin (you can restrict this to your domain)
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/config', (req, res) => {
  res.json({ placeId: process.env.PLACE_ID });
});

// Endpoint to fetch place details and reviews (with pagination)
app.get('/api/place-details', async (req, res) => {
  const { placeId, nextPageToken, language } = req.query; // Fetch placeId and nextPageToken from the query params

  try {
    // Build the request parameters for the Places API
    let params = {
      placeid: placeId,
      key: GOOGLE_API_KEY,
      fields: 'rating,user_ratings_total,reviews,name',
      language: 'en'
    };

    // If there's a nextPageToken, add it to the parameters to fetch more reviews
    if (nextPageToken) {
      params.pagetoken = nextPageToken;
    }

    if (language){
      params.language = language;
    }

    // Fetch data from the Google Places API
    const response = await axios.get(GOOGLE_PLACES_API_URL, { params });

    // Return the data along with the nextPageToken (if available)
    res.json({
      result: response.data.result,
      nextPageToken: response.data.next_page_token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch place details' });
  }
});

// 🔁 Simple in-memory cache (could upgrade to filesystem or Redis later)
const imageCache = new Map();

app.get('/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send('Missing image URL');

  try {
    // Check cache first
    if (imageCache.has(imageUrl)) {
      const { data, contentType } = imageCache.get(imageUrl);
      res.setHeader('Content-Type', contentType);
      return res.send(data);
    }

    // Fetch the image
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'];
    const data = response.data;

    // Store in cache
    imageCache.set(imageUrl, { data, contentType });

    // Return the image
    res.setHeader('Content-Type', contentType);
    res.send(data);
  } catch (err) {
    console.error('Image fetch failed:', err.message);
    res.status(500).send('Image fetch failed');
  }
});

// Start the server
https.createServer(credentials, app).listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});
