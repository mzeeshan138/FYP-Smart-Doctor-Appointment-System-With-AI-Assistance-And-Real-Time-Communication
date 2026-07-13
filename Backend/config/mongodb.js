import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const nodeEnv = process.env.NODE_ENV?.trim();
    const uri =
      nodeEnv === "PRODUCTION" ? process.env.DB_URI : process.env.DB_LOCAL_URI;

    if (!uri) {
      throw new Error(
        nodeEnv === "PRODUCTION"
          ? "DB_URI is not configured for PRODUCTION"
          : "DB_LOCAL_URI is not configured for DEVELOPMENT"
      );
    }

    const connectionInstance = await mongoose.connect(uri);

    console.log(
      `\nMongoDb connected || DB HOST:${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection FAILED ", error);
    process.exit(1);
  }
};

export default connectDB;
