import test, { after } from "node:test"
import assert from "node:assert"
import { signInternalRequest, createInternalAuthMiddleware } from "../../../shared/internalAuth/internalAuth.js"
import redis from "../../../shared/redis/redis.js"

const SECRET = "test-secret-not-a-real-credential"

const makeRes = () => {
    const res = { statusCode: null, body: null }
    res.status = (code) => { res.statusCode = code; return res }
    res.json = (body) => { res.body = body; return res }
    return res
}

test("rejects a request with no internal auth headers", async () => {
    const middleware = createInternalAuthMiddleware(SECRET)
    const req = { headers: {}, body: { userId: "u1", agent: "chat" } }
    const res = makeRes()
    let nextCalled = false
    await middleware(req, res, () => { nextCalled = true })
    assert.equal(res.statusCode, 401)
    assert.equal(nextCalled, false)
})

test("rejects a request with a stale timestamp even if the signature is otherwise valid", async () => {
    const middleware = createInternalAuthMiddleware(SECRET)
    const body = { userId: "u1", agent: "chat" }
    const staleTimestamp = (Date.now() - 10 * 60 * 1000).toString() // 10 minutes old
    const crypto = await import("crypto")
    const signature = crypto.createHmac("sha256", SECRET).update(`${staleTimestamp}.${JSON.stringify(body)}`).digest("hex")

    const req = { headers: { "x-internal-timestamp": staleTimestamp, "x-internal-signature": signature }, body }
    const res = makeRes()
    let nextCalled = false
    await middleware(req, res, () => { nextCalled = true })
    assert.equal(res.statusCode, 401)
    assert.equal(nextCalled, false)
})

test("rejects a request whose signature does not match the body", async () => {
    const middleware = createInternalAuthMiddleware(SECRET)
    const body = { userId: "u1", agent: "chat" }
    const { timestamp } = signInternalRequest(SECRET, body)

    const req = {
        headers: { "x-internal-timestamp": timestamp, "x-internal-signature": "0".repeat(64) },
        body: { userId: "u1", agent: "coding" } // tampered after signing
    }
    const res = makeRes()
    let nextCalled = false
    await middleware(req, res, () => { nextCalled = true })
    assert.equal(res.statusCode, 401)
    assert.equal(nextCalled, false)
})

test("signInternalRequest produces a signature that verifies against the same body", async () => {
    const body = { userId: "u1", agent: "chat" }
    const { timestamp, signature } = signInternalRequest(SECRET, body)
    const crypto = await import("crypto")
    const expected = crypto.createHmac("sha256", SECRET).update(`${timestamp}.${JSON.stringify(body)}`).digest("hex")
    assert.equal(signature, expected)
})

after(() => {
    redis.disconnect()
})
