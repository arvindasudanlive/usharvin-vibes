// const sqlite3 = require("sqlite3").verbose();
// const path = require("path");



// // This creates a local file named cinevinyl.db in your backend folder
// const dbPath = path.resolve(__dirname, "cinevinyl.db");

// const db = new sqlite3.Database(dbPath, (err) => {
//   if (err) {
//     console.error("Error opening database:", err.message);
//   } else {
//     console.log("Needle dropped: Connected to the SQLite database.");

//     // Initialize Tables
//     db.serialize(() => {
//       // Table 1: Playlists
//       db.run(`
//         CREATE TABLE IF NOT EXISTS playlists (
//           id INTEGER PRIMARY KEY AUTOINCREMENT,
//           name TEXT NOT NULL,
//           created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//         )
//       `);

//       // Table 2: Tracks (Linked to Playlists)
//       db.run(`
//         CREATE TABLE IF NOT EXISTS tracks (
//           id INTEGER PRIMARY KEY AUTOINCREMENT,
//           playlist_id INTEGER,
//           title TEXT NOT NULL,
//           movie TEXT,
//           artist TEXT,
//           year TEXT,
//           platform TEXT,
//           url TEXT NOT NULL,
//           FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE
//         )
//       `);
//     });
//   }
// });

// module.exports = db;

const { Pool } = require("pg");
const pool = new Pool({
  connectionString:
    "postgresql://YOUR_NEON_USERNAME:YOUR_PASSWORD@ep-nameless-lake-123456.us-east-2.aws.neon.tech/neondb?sslmode=require",
});