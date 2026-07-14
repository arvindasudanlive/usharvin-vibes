require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for secure cloud databases
});

// 2. Automatically Create Tables if they don't exist
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS playlists (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tracks (
        id SERIAL PRIMARY KEY,
        playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255),
        movie VARCHAR(255),
        year VARCHAR(4),
        platform VARCHAR(50),
        url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ PostgreSQL Database connected and tables verified.");
  } catch (err) {
    console.error("❌ Database initialization error:", err);
  }
};
initDB();

// 3. API Routes

// Get all playlists (with track counts)
app.get("/api/playlists", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, COUNT(t.id)::int AS "tracksCount"
      FROM playlists p
      LEFT JOIN tracks t ON p.id = t.playlist_id
      GROUP BY p.id
      ORDER BY p.created_at DESC;
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new playlist
app.get("/api/playlists", async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      "INSERT INTO playlists (name) VALUES ($1) RETURNING *",
      [name],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tracks for a specific playlist
app.get("/api/playlists/:id/tracks", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM tracks WHERE playlist_id = $1 ORDER BY created_at DESC",
      [id],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a track to a playlist
app.post("/api/playlists/:id/tracks", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist, movie, year, platform, url } = req.body;
    const result = await pool.query(
      `INSERT INTO tracks (playlist_id, title, artist, movie, year, platform, url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, title, artist, movie, year, platform, url],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// YouTube Search API
app.get("/api/search", async (req, res) => {
  try {
    const { q, language } = req.query;
    const searchQuery = `${q} ${language} song official audio`;

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: searchQuery,
          type: "video",
          maxResults: 10,
          key: process.env.YOUTUBE_API_KEY,
        },
      },
    );

    // Format YouTube results to match our app's track layout
    const tracks = response.data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title.replace(/"/g, '"').replace(/'/g, "'"),
      artist: item.snippet.channelTitle,
      movie: "YouTube Search",
      year: new Date(item.snippet.publishedAt).getFullYear().toString(),
      platform: "YouTube",
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    res.json(tracks);
  } catch (err) {
    console.error("YouTube API Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
