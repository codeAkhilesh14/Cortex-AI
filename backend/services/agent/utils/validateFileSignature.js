import fs from "fs/promises"

// Magic-byte checks so an upload's actual content is verified against its
// declared mimetype instead of trusting the client-supplied Content-Type.
const SIGNATURES = [
    { mimetype: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
    { mimetype: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
    { mimetype: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
    { mimetype: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
    { mimetype: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, webp: true }
]

export const isFileSignatureValid = async (filePath, mimetype) => {
    const matchingSignature = SIGNATURES.find((s) => s.mimetype === mimetype)
    if (!matchingSignature) {
        return false
    }

    const handle = await fs.open(filePath, "r")
    try {
        const header = Buffer.alloc(12)
        await handle.read(header, 0, 12, 0)

        const matchesBytes = matchingSignature.bytes.every((byte, index) => header[index] === byte)
        if (!matchesBytes) {
            return false
        }

        if (matchingSignature.webp) {
            return header.toString("ascii", 8, 12) === "WEBP"
        }

        return true
    } finally {
        await handle.close()
    }
}
