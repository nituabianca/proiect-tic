// backend/server.js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

dotenv.config();
// IMMEDIATELY AFTER dotenv.config(), add this console.log:
console.log("DEBUG: process.env.JWT_SECRET =", process.env.JWT_SECRET);
console.log("DEBUG: Current Working Directory =", process.cwd());

// --- IMPORTANT: Import your main backend Firebase Admin setup early ---
// This line ensures that backend/firebase.js is executed,
// which includes the admin.initializeApp() call.
const { admin, db } = require("./firebase/firebase"); // <--- This now points to your backend/firebase.js
// --- END IMPORTANT ---

const routes = require("./routes"); // Principal routes import

const app = express();

app.use(
  cors({
    origin: "http://localhost:3001", // Frontend URL
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use("/api", routes); // All routes from `routes/index.js` will be prefixed with /api

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(process.env.JWT_SECRET);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
