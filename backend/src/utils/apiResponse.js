class ApiResponse {
  static success(res, data = null, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static error(res, code = "INTERNAL_SERVER_ERROR", message = "An error occurred", details = [], statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        details: Array.isArray(details) ? details : [details]
      }
    });
  }

  static validationError(res, details = []) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details
      }
    });
  }

  static forbidden(res, message = "Access denied: insufficient permissions") {
    return res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message,
        details: []
      }
    });
  }

  static unauthorized(res, message = "Authentication required or token expired") {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message,
        details: []
      }
    });
  }

  static notFound(res, message = "Requested resource was not found") {
    return res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message,
        details: []
      }
    });
  }

  static conflict(res, message = "Resource already exists or conflicts with current state") {
    return res.status(409).json({
      success: false,
      error: {
        code: "CONFLICT",
        message,
        details: []
      }
    });
  }
}

module.exports = ApiResponse;