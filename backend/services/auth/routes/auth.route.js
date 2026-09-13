import express from "express"
import { login, logOut, updateUserPayment, checkCredits, deductCredits } from "../controllers/auth.controller.js"

const authRouter = express.Router()

authRouter.post("/login", login)
authRouter.get("/logout", logOut)
authRouter.post("/update-plan", updateUserPayment)
authRouter.post("/check-credits", checkCredits)
authRouter.post("/deduct-credits", deductCredits)

export default authRouter