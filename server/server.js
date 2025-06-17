const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const helmet = require("helmet"); // <-- 1. Import helmet
const rateLimit = require("express-rate-limit"); // <-- 2. Import express-rate-limit
//npm install helmet express-rate-limit

dotenv.config();

// --- Firebase Admin setup ---
// This ensures Firebase is initialized before any routes need it.
require("./firebase/firebase");

const routes = require("./routes"); // Master routes import

const app = express();

// --- Security Middleware ---
app.use(helmet()); // <-- 3. Use helmet to set secure HTTP headers

// --- CORS Configuration ---
const corsOptions = {
  // Use the environment variable for the origin
  origin: process.env.CLIENT_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle pre-flight requests for all routes

// --- Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api", limiter); // <-- 4. Apply the rate limiter to all API routes

// --- Standard Middleware ---
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// --- API Routes ---
app.use("/api", routes);

// --- Error Handling Middleware ---

// 404 Handler: This should be placed after your routes and before the general error handler.
app.use((req, res, next) => {
  const error = new Error("Not Found - The requested resource does not exist.");
  error.status = 404;
  next(error); // Pass the error to the next middleware (the 500 handler)
});

// General 500 Error Handler: This catches all errors passed by `next(error)`.
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.stack);
  const errorStatus = err.status || 500;
  const errorMessage = process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message;
  
  res.status(errorStatus).json({
    error: errorMessage,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// --- Process-level Error Handlers (Your existing ones are great) ---
process.on("unhandledRejection", (err) => {
  console.error("FATAL: Unhandled Promise Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("FATAL: Uncaught Exception:", err);
  process.exit(1);
});
