import test from "node:test"
import assert from "node:assert"
import fs from "fs/promises"
import os from "os"
import path from "path"
import { isFileSignatureValid } from "../utils/validateFileSignature.js"

const writeTempFile = async (bytes) => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cortexai-upload-test-"))
    const filePath = path.join(dir, "upload")
    await fs.writeFile(filePath, Buffer.from(bytes))
    return filePath
}

test("accepts a real PDF signature declared as application/pdf", async () => {
    const filePath = await writeTempFile([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])
    assert.equal(await isFileSignatureValid(filePath, "application/pdf"), true)
})

test("accepts a real PNG signature declared as image/png", async () => {
    const filePath = await writeTempFile([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    assert.equal(await isFileSignatureValid(filePath, "image/png"), true)
})

test("rejects content whose bytes do not match the declared mimetype", async () => {
    const filePath = await writeTempFile(Buffer.from("<html>not an image</html>"))
    assert.equal(await isFileSignatureValid(filePath, "image/png"), false)
})

test("rejects a mimetype that is not in the allowlist", async () => {
    const filePath = await writeTempFile([0x25, 0x50, 0x44, 0x46])
    assert.equal(await isFileSignatureValid(filePath, "application/octet-stream"), false)
})
