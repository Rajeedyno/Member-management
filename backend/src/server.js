const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const app = require("./app");
const { connectDB } = require("./config/db");

const PORT = parseInt(process.env.PORT, 10) || 5050;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log("===================================================");
      console.log(" Member Management System Backend API");
      console.log(` Server running on http://127.0.0.1:${PORT}`);
      console.log(` Health check: http://127.0.0.1:${PORT}/api/health`);
      console.log("===================================================");
    });

    process.on("SIGTERM", () => {
      server.close(() => console.log("Process terminated"));
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { startServer };