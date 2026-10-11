import express from "express"
import { login, logOut, updateUserPayment, checkCredits, deductCredits } from "../controllers/auth.controller.js"
import { createInternalAuthMiddleware } from "../../../shared/internalAuth/internalAuth.js"

const authRouter = express.Router()

const verifyInternalRequest = createInternalAuthMiddleware(process.env.INTERNAL_SERVICE_SECRET)

authRouter.post("/login", login)
authRouter.post("/logout", logOut)
authRouter.post("/update-plan", verifyInternalRequest, updateUserPayment)
authRouter.post("/check-credits", verifyInternalRequest, checkCredits)
authRouter.post("/deduct-credits", verifyInternalRequest, deductCredits)

export default authRouter