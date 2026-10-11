import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";

const uploadDir = path.resolve("./temp")

if(!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const EXTENSION_BY_MIMETYPE = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp"
}

// Never derive the on-disk filename from the client-supplied originalname -
// it can contain path traversal sequences (e.g. "../../etc/passwd").
export const buildSafeFilename = (mimetype) => {
    const extension = EXTENSION_BY_MIMETYPE[mimetype] || ""
    return `${crypto.randomUUID()}${extension}`
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        cb(null, buildSafeFilename(file.mimetype));
    }
})

const fileFilter = (req, file, cb) => {
    if(file.mimetype=="application/pdf" || file.mimetype.startsWith("image/")) {
        cb(null, true)
    } else {
        cb(new Error("Only PDF and image files are allowed"))
    }
}

export default multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });
