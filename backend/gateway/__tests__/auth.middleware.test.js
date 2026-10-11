import test, { after } from "node:test"
import assert from "node:assert"
import protect, { verifyCsrf } from "../middleware/auth.middleware.js"
import redis from "../../shared/redis/redis.js"

const makeRes = () => {
    const res = { statusCode: null, body: null }
    res.status = (code) => { res.statusCode = code; return res }
    res.json = (body) => { res.body = body; return res }
    return res
}

test("protect rejects a request with no session cookie", async () => {
    const req = { cookies: {}, headers: {}, method: "GET" }
    const res = makeRes()
    let nextCalled = false
    await protect(req, res, () => { nextCalled = true })
    assert.equal(res.statusCode, 401)
    assert.equal(nextCalled, false)
})

test("protect rejects a session id that redis does not recognize", async (t) => {
    t.mock.method(redis, "get", async () => null)
    const req = { cookies: { session: "unknown-session" }, headers: {}, method: "GET" }
    const res = makeRes()
    let nextCalled = false
    await protect(req, res, () => { nextCalled = true })
    assert.equal(res.statusCode, 401)
    assert.equal(nextCalled, false)
})

test("protect accepts a GET with a valid session and does not require a CSRF token", async (t) => {
    t.mock.method(redis, "get", async () => JSON.stringify({ userId: "user-1" }))
    const req = { cookies: { session: "valid-session" }, headers: {}, method: "GET" }
    const res = makeRes()
    let nextCalled = false
    await protect(req, res, () => { nextCalled = true })
    assert.equal(nextCalled, true)
    assert.deepEqual(req.user, { userId: "user-1" })
})

test("protect rejects a mutating request with a valid session but a missing/mismatched CSRF token", async (t) => {
    t.mock.method(redis, "get", async () => JSON.stringify({ userId: "user-1" }))
    const req = { cookies: { session: "valid-session", csrf: "real-token" }, headers: { "x-csrf-token": "wrong-token" }, method: "POST" }
    const res = makeRes()
    let nextCalled = false
    await protect(req, res, () => { nextCalled = true })
    assert.equal(res.statusCode, 403)
    assert.equal(nextCalled, false)
})

test("protect accepts a mutating request with a valid session and matching CSRF token", async (t) => {
    t.mock.method(redis, "get", async () => JSON.stringify({ userId: "user-1" }))
    const req = { cookies: { session: "valid-session", csrf: "real-token" }, headers: { "x-csrf-token": "real-token" }, method: "POST" }
    const res = makeRes()
    let nextCalled = false
    await protect(req, res, () => { nextCalled = true })
    assert.equal(nextCalled, true)
})

test("verifyCsrf bypasses the check for safe methods", () => {
    const req = { cookies: {}, headers: {}, method: "GET" }
    const res = makeRes()
    let nextCalled = false
    verifyCsrf(req, res, () => { nextCalled = true })
    assert.equal(nextCalled, true)
})

after(() => {
    redis.disconnect()
})
