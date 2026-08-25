const ApiResponse = require("../utils/apiResponse");

const errorHandler = (err, req, res, next) => {
  console.error("Unhandled Application Error:", {
    url: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const details = Object.keys(err.errors).map((key) => ({
      field: key,
      message: err.errors[key].message
    }));
    return ApiResponse.validationError(res, details);
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return ApiResponse.conflict(
      res,
      `Duplicate value for ${field}. It must be unique.`
    );
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return ApiResponse.unauthorized(res, "Invalid or expired token");
  }

  // Default internal server error
  return ApiResponse.error(
    res,
    "INTERNAL_SERVER_ERROR",
    err.message || "An unexpected internal server error occurred",
    [],
    err.statusCode || 500
  );
};

module.exports = {
  errorHandler
};