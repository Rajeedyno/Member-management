const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes");
const { errorHandler } = require("./middleware/errorHandler");
const ApiResponse = require("./utils/apiResponse");

const app = express();

// Security & Parsing Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// API Routes
app.use("/api", routes);

// 404 Handler
app.use((req, res) => {
  return ApiResponse.notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;