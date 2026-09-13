import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";
import authRouter from "./routes/auth.route.js";
import cookieParser from "cookie-parser";

const PORT = process.env.PORT || 8001;

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);

app.get("/", (req, res) => {
  res.status(200).json({ status: "Hello from Auth service" });
});

app.listen(PORT, () => {
  connectDB();
  console.log(`Auth service is running on port ${PORT}`);
});