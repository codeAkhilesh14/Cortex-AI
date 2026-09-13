import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";
import agentRouter from "./routes/agent.route.js";

const PORT = process.env.PORT || 8002;

const app = express();
app.use(express.json());

app.use("/", agentRouter)

app.use((err, req, res, next)=>{
  console.log(err);
  if(err.status) {
    return res.status(err.status).json(err.data)
  }
  return res.status(500).json({ message: "Internal Server Error while calling agent" })
})

app.get("/", (req, res) => {
  res.status(200).json({ status: "Hello from Agent service" });
});

app.listen(PORT, () => {
  connectDB();
  console.log(`Agent service is running on port ${PORT}`);
});  