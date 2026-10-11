import { cert, initializeApp } from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// In production the service account comes from the FIREBASE_SERVICE_ACCOUNT
// env var (a JSON string, provided via the platform's secret manager) so the
// key never has to exist inside the built image. Local dev keeps using the
// gitignored serviceAccountKey.json file.
const getServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const keyPath = path.join(__dirname, "../serviceAccountKey.json");
  return JSON.parse(fs.readFileSync(keyPath, "utf-8"));
};

export const app = initializeApp({
  credential: cert(getServiceAccount())
});
