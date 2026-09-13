import express from "express";
import dotenv from "dotenv";
dotenv.config();
import proxy from "express-http-proxy";
import cors from "cors";
import cookieParser from "cookie-parser";
import protect from "./middleware/auth.middleware.js";
import { getCurrentUser } from "./controllers/user.controller.js";
import { proxyWithHeader } from "./utils/proxyWithHeader.js";
import morgan from "morgan"

const PORT = process.env.PORT || 8000;

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true 
}))
app.use(cookieParser());

app.use(morgan("dev"))
app.use("/api/auth", proxy(process.env.AUTH_SERVICE));
app.use("/api/chat", protect, proxyWithHeader(process.env.CHAT_SERVICE));
app.use("/api/agent", protect, proxyWithHeader(process.env.AGENT_SERVICE));
app.use("/api/billing", protect, proxyWithHeader(process.env.BILLING_SERVICE));

app.get("/api/me", protect, getCurrentUser);

app.get("/", (req, res) => {
  res.status(200).json({ status: "Gateway service is healthy v1" });
});

app.listen(PORT, () => {
  console.log(`Gateway service is running on port ${PORT}`);
});