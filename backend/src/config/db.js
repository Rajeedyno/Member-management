const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Configure a project-local download/cache directory for mongodb-memory-server
// before loading the library so it doesn't attempt to access the user's home
// cache (which can trigger EPERM on some systems).
const projectDownloadDir = path.resolve(__dirname, "../../.cache/mongodb-binaries");
try {
  fs.mkdirSync(projectDownloadDir, { recursive: true });
  process.env.MONGOMS_DOWNLOAD_DIR = projectDownloadDir;
} catch (e) {
  // If we can't create it, continue and let the library handle fallbacks.
  console.warn("Could not ensure project download dir:", e.message);
}
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer = null;

const connectDB = async () => {
  try {
    const customUri = process.env.MONGODB_URI;
    if (customUri) {
      console.log("Attempting connection to configured MongoDB URI...");
      await mongoose.connect(customUri, { serverSelectionTimeoutMS: 5000 });
      console.log("Connected to MongoDB via URI:", customUri.split("@").pop());
      return;
    }

    try {
      console.log("Attempting local MongoDB connection (mongodb://127.0.0.1:27017/member_management)...");
      await mongoose.connect("mongodb://127.0.0.1:27017/member_management", {
        serverSelectionTimeoutMS: 2000
      });
      console.log("Connected to local MongoDB instance.");
    } catch (localErr) {
      console.log("Local MongoDB not available. Starting embedded MongoDB Memory Server for zero-config execution...");
      // Try to start the embedded MongoDB. If it fails due to permission errors
      // accessing the user's home cache, retry with a project-local download dir.
      const downloadDir = path.resolve(__dirname, "../../.cache/mongodb-binaries");
      try {
        mongoServer = await MongoMemoryServer.create();
      } catch (msErr) {
        const isPermErr = msErr && msErr.code === 'EPERM' && msErr.path && msErr.path.includes('.cache/mongodb-binaries');
        if (isPermErr) {
          try {
            fs.mkdirSync(downloadDir, { recursive: true });
            process.env.MONGOMS_DOWNLOAD_DIR = downloadDir;
            console.warn("EPERM detected. Retrying MongoMemoryServer with project-local downloadDir:", downloadDir);
            mongoServer = await MongoMemoryServer.create({ binary: { downloadDir } });
          } catch (retryErr) {
            console.error("Retrying MongoMemoryServer failed:", retryErr.message);
            throw retryErr;
          }
        } else {
          throw msErr;
        }
      }
      const inMemoryUri = mongoServer.getUri();
      await mongoose.connect(inMemoryUri);
      console.log("Connected to embedded MongoDB Memory Server successfully.");
    }
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (err) {
    console.error("Error disconnecting DB:", err.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};