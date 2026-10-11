import express from "express";
import dotenv from "dotenv";
dotenv.config();
import proxy from "express-http-proxy";
import cors from "cors";
import cookieParser from "cookie-parser";
import protect, { verifyCsrf } from "./middleware/auth.middleware.js";
import { getCurrentUser } from "./controllers/user.controller.js";
import { proxyWithHeader } from "./utils/proxyWithHeader.js";
import { checkRateLimit } from "../shared/rateLimit/rateLimit.js";
import morgan from "morgan"

const PORT = process.env.PORT || 8000;

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))
app.use(cookieParser());

app.use(morgan("dev"))

// Only login/logout are reachable through the gateway. Internal auth
// operations (update-plan, check-credits, deduct-credits) are called
// service-to-service and must never be exposed through this proxy.
const PUBLIC_AUTH_PATHS = new Set(["/login", "/logout"]);

const authGateway = async (req, res, next) => {
  if (!PUBLIC_AUTH_PATHS.has(req.path)) {
    return res.status(404).json({ message: "Not Found" });
  }

  if (req.path === "/login") {
    const { allowed, retryAfter } = await checkRateLimit(`rate:login:${req.ip}`, 10, 60);
    if (!allowed) {
      return res.status(429).json({ message: `Too many login attempts. Try again in ${retryAfter}s.` });
    }
    return next();
  }

  return verifyCsrf(req, res, next);
};

app.use("/api/auth", authGateway, proxy(process.env.AUTH_SERVICE));
app.use("/api/chat", protect, proxyWithHeader(process.env.CHAT_SERVICE));
app.use("/api/agent", protect, proxyWithHeader(process.env.AGENT_SERVICE));
app.use("/api/billing", protect, proxyWithHeader(process.env.BILLING_SERVICE));

app.get("/api/me", protect, getCurrentUser);

app.get("/", (req, res) => {
  res.status(200).json({ status: "Gateway service is healthy v1" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "Gateway service is healthy v1" });
});

app.listen(PORT, () => {
  console.log(`Gateway service is running on port ${PORT}`);
});
