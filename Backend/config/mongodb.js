import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      process.env.NODE_ENV === "PRODUCTION" ? process.env.DB_URI : process.env.DB_LOCAL_URI
    );

    console.log(
      `\nMongoDb connected || DB HOST:${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection FAILED ", error);
    process.exit(1);
  }
};

export default connectDB;
