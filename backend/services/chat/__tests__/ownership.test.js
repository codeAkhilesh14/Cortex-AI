import test from "node:test"
import assert from "node:assert"
import Conversation from "../models/conversation.model.js"
import Message from "../models/message.model.js"
import { updateConversation, saveMessage, getMessages } from "../controllers/chat.controller.js"

const makeRes = () => {
    const res = { statusCode: null, body: null }
    res.status = (code) => { res.statusCode = code; return res }
    res.json = (body) => { res.body = body; return res }
    return res
}

test("updateConversation returns 404 and does not leak another user's conversation", async (t) => {
    const findOneAndUpdate = t.mock.method(Conversation, "findOneAndUpdate", async () => null)
    const req = { headers: { "x-user-id": "user-1" }, body: { id: "conv-owned-by-user-2", title: "Hijacked" } }
    const res = makeRes()

    await updateConversation(req, res)

    assert.equal(res.statusCode, 404)
    assert.deepEqual(findOneAndUpdate.mock.calls[0].arguments[0], { _id: "conv-owned-by-user-2", userId: "user-1" })
})

test("updateConversation succeeds when the caller owns the conversation", async (t) => {
    t.mock.method(Conversation, "findOneAndUpdate", async () => ({ _id: "conv-1", userId: "user-1", title: "New title" }))
    const req = { headers: { "x-user-id": "user-1" }, body: { id: "conv-1", title: "New title" } }
    const res = makeRes()

    await updateConversation(req, res)

    assert.equal(res.statusCode, 200)
})

test("saveMessage returns 404 and never creates a message for a conversation the caller does not own", async (t) => {
    t.mock.method(Conversation, "findOne", async () => null)
    const create = t.mock.method(Message, "create", async () => ({}))
    const req = { headers: { "x-user-id": "user-1" }, body: { conversationId: "conv-owned-by-user-2", role: "user", content: "hi" } }
    const res = makeRes()

    await saveMessage(req, res)

    assert.equal(res.statusCode, 404)
    assert.equal(create.mock.callCount(), 0)
})

test("getMessages returns 404 for a conversation the caller does not own, without reading messages", async (t) => {
    t.mock.method(Conversation, "findOne", async () => null)
    const find = t.mock.method(Message, "find", async () => [])
    const req = { headers: { "x-user-id": "user-1" }, params: { conversationId: "conv-owned-by-user-2" } }
    const res = makeRes()

    await getMessages(req, res)

    assert.equal(res.statusCode, 404)
    assert.equal(find.mock.callCount(), 0)
})
