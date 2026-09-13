import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";
import billingRouter from "./routes/billing.routes.js";

const PORT = process.env.PORT || 8002;

const app = express();
app.use(express.json());

app.use("/", billingRouter);

app.get("/", (req, res) => {
  res.status(200).json({ status: "Hello from Billing service" });
});

app.listen(PORT, () => {
  connectDB();
  console.log(`Billing service is running on port ${PORT}`);
});