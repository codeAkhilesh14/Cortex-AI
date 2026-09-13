import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";
import chatRouter from "./routes/chat.routes.js";

const PORT = process.env.PORT || 8002;

const app = express();
app.use(express.json());

app.use('/', chatRouter)

app.get("/", (req, res) => {
  res.status(200).json({ status: "Hello from Chat service" });
});

app.listen(PORT, () => {
  connectDB();
  console.log(`Chat service is running on port ${PORT}`);
});