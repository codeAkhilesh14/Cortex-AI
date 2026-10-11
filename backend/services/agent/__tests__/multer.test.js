import test from "node:test"
import assert from "node:assert"
import { buildSafeFilename } from "../config/multer.js"

test("buildSafeFilename never includes a client-supplied path", () => {
    const filename = buildSafeFilename("application/pdf")
    assert.ok(!filename.includes("/"))
    assert.ok(!filename.includes("\\"))
    assert.ok(!filename.includes(".."))
    assert.ok(filename.endsWith(".pdf"))
})

test("buildSafeFilename ignores a traversal attempt entirely (filename is derived only from mimetype)", () => {
    // The function never even takes the original filename as input - this
    // documents that a crafted originalname like "../../etc/passwd" can no
    // longer influence the generated path at all.
    const filename = buildSafeFilename("image/png")
    assert.ok(!filename.includes(".."))
    assert.ok(filename.endsWith(".png"))
})

test("buildSafeFilename falls back to no extension for an unmapped mimetype", () => {
    const filename = buildSafeFilename("application/octet-stream")
    assert.ok(!filename.includes("."))
})
