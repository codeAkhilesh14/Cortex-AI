import test, { after } from "node:test"
import assert from "node:assert"
import { checkAgentLimit } from "../config/agentLimit.js"
import redis from "../../../shared/redis/redis.js"

test("checkAgentLimit rejects an unknown agent before touching redis", async () => {
    await assert.rejects(
        () => checkAgentLimit("user-1", "not-a-real-agent"),
        (error) => {
            assert.equal(error.status, 400)
            assert.equal(error.data.success, false)
            return true
        }
    )
})

after(() => {
    redis.disconnect()
})
