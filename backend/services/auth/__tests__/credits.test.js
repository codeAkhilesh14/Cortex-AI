import test, { after } from "node:test"
import assert from "node:assert"
import { checkCredits, deductCredits } from "../controllers/auth.controller.js"
import redis from "../../../shared/redis/redis.js"

const makeRes = () => {
    const res = { statusCode: null, body: null }
    res.status = (code) => { res.statusCode = code; return res }
    res.json = (body) => { res.body = body; return res }
    return res
}

test("checkCredits rejects a request with no userId", async () => {
    const req = { body: { agent: "chat" } }
    const res = makeRes()
    await checkCredits(req, res)
    assert.equal(res.statusCode, 400)
})

test("checkCredits rejects an agent name outside the server-defined cost table", async () => {
    const req = { body: { userId: "507f1f77bcf86cd799439011", agent: "not-a-real-agent" } }
    const res = makeRes()
    await checkCredits(req, res)
    assert.equal(res.statusCode, 400)
})

test("deductCredits rejects a request with no userId", async () => {
    const req = { body: { agent: "chat" } }
    const res = makeRes()
    await deductCredits(req, res)
    assert.equal(res.statusCode, 400)
})

test("deductCredits rejects an agent name outside the server-defined cost table", async () => {
    const req = { body: { userId: "507f1f77bcf86cd799439011", agent: "not-a-real-agent" } }
    const res = makeRes()
    await deductCredits(req, res)
    assert.equal(res.statusCode, 400)
})

after(() => {
    redis.disconnect()
})
