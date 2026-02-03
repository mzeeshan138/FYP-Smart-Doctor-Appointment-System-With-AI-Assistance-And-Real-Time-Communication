import dotenv from 'dotenv';
import express, { application } from "express";
import cors from "cors";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudnary.js";
import adminRouter from "./routes/adminRoute.js";
import aiChatRouter from "./routes/aiChatRoutes.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/usersRoute.js";
import fileUpload from "express-fileupload";

//Setting Environment
if (process.env.NODE_ENV !== 'PRODUCTION') {
  dotenv.config({ path: 'config/config.env' });
}

//app config
const app = express();
const port = process.env.PORT || 4000;



connectDB();
connectCloudinary();

//middlewares
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5174","http://localhost:8000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
// app.use(express.urlencoded({ extended: true })); // Handles form data
// app.use(fileUpload()); // Enables file uploads

//api end points
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);
app.use("/api/ai", aiChatRouter);


app.listen(port, () => console.log(`\nserver is running on ${port}`));
