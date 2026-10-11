import { PLANS } from "../config/Plans.js"
import razorpay from "../config/razorpay.js"
import Payment from "../models/payment.model.js"
import crypto from "crypto"
import axios from "axios"
import { checkRateLimit } from "../../../shared/rateLimit/rateLimit.js"
import { signInternalRequest } from "../../../shared/internalAuth/internalAuth.js"

export const verifyRazorpaySignature = (orderId, paymentId, signature, secret) => {
    const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex")
    return expected === signature
}

export const createOrder = async (req, res) => {
    try {
        const { plan } = req.body
        const userId = req.headers["x-user-id"]

        const selectedPlan = PLANS[plan]

        if(!selectedPlan) {
            return res.status(404).json({ message: "Plan Not Found" })
        }

        const order = await razorpay.orders.create({
            amount: selectedPlan.amount * 100, // in paise
            currency: "INR",
            receipt: `receipt-${Date.now()}`
        })

        await Payment.create({
            userId,
            orderId: order.id,
            amount: selectedPlan.amount,
            credits: selectedPlan.credits,
            plan: selectedPlan.id,
            currency: order.currency,
            status: "created"
        })

        return res.status(200).json({ order, plan: selectedPlan })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error during order creation" })
    }
}

export const verifyPayment = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"]
        const { allowed, retryAfter } = await checkRateLimit(`rate:verify-payment:${userId}`, 20, 60)
        if (!allowed) {
            return res.status(429).json({ message: `Too many verification attempts. Try again in ${retryAfter}s.` })
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

        if(!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, process.env.RAZORPAY_KEY_SECRET)) {
            return res.status(404).json({ message: "Payment Verification Failed" })
        }

        const existingPayment = await Payment.findOne({ orderId: razorpay_order_id })

        if(!existingPayment) {
            return res.status(404).json({ message: "Payment Not Found" })
        }

        if(existingPayment.userId !== userId) {
            return res.status(403).json({ message: "Payment does not belong to this user" })
        }

        if(existingPayment.status === "paid") {
            return res.status(200).json({ message: "Payment Verified Successfully" })
        }

        // Atomic created -> paid transition so a replayed/concurrent verification
        // can never grant credits more than once for the same order.
        const payment = await Payment.findOneAndUpdate(
            { orderId: razorpay_order_id, status: "created" },
            { status: "paid", paymentId: razorpay_payment_id },
            { new: true }
        )

        if(!payment) {
            // Someone else already completed the transition between our reads.
            return res.status(200).json({ message: "Payment Verified Successfully" })
        }

        const updatePlanPayload = {
            userId: payment.userId,
            plan: payment.plan,
            credits: payment.credits,
        }
        const { timestamp, signature } = signInternalRequest(process.env.INTERNAL_SERVICE_SECRET, updatePlanPayload)

        await axios.post(`${process.env.AUTH_SERVICE}/update-plan`, updatePlanPayload, {
            headers: {
                "x-internal-timestamp": timestamp,
                "x-internal-signature": signature
            }
        })
        return res.status(200).json({ message: "Payment Verified Successfully" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error during payment verification" })
    }
}
