import mongoose from "mongoose"

const paymentSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    paymentId: {
        type: String,
        unique: true,
        sparse: true
    },
    amount: String,
    currency: {
        type: String,
        default: "INR"
    },
    credits: {
        type: Number
    },
    plan: {
        type: String,
    },
    status: {
        type: String,
        enum: ["created", "paid", "failed"],
        default: "created"
    }
}, { timeStamps: true })

const Payment = mongoose.model("Payment", paymentSchema)

export default Payment