import test, { after } from "node:test"
import assert from "node:assert"
import crypto from "crypto"
import { verifyRazorpaySignature } from "../controllers/billing.controller.js"
import redis from "../../../shared/redis/redis.js"

const SECRET = "test-razorpay-secret-not-real"

test("accepts a correctly computed signature", () => {
    const orderId = "order_abc123"
    const paymentId = "pay_xyz789"
    const signature = crypto.createHmac("sha256", SECRET).update(`${orderId}|${paymentId}`).digest("hex")
    assert.equal(verifyRazorpaySignature(orderId, paymentId, signature, SECRET), true)
})

test("rejects a signature computed for a different order/payment pair", () => {
    const signature = crypto.createHmac("sha256", SECRET).update("order_abc123|pay_xyz789").digest("hex")
    assert.equal(verifyRazorpaySignature("order_abc123", "pay_someone_elses", signature, SECRET), false)
})

test("rejects a forged signature", () => {
    assert.equal(verifyRazorpaySignature("order_abc123", "pay_xyz789", "not-a-real-signature", SECRET), false)
})

after(() => {
    redis.disconnect()
})
