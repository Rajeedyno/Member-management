const ApiResponse = require("../utils/apiResponse");

const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map((item) => ({
        field: item.path.join("."),
        message: item.message.replace(/"/g, "")
      }));
      return ApiResponse.validationError(res, details);
    }

    req.body = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map((item) => ({
        field: item.path.join("."),
        message: item.message.replace(/"/g, "")
      }));
      return ApiResponse.validationError(res, details);
    }

    req.query = value;
    next();
  };
};

module.exports = {
  validateBody,
  validateQuery
};