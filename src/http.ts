/**
 * `express-http-api`
 * 🔹 A lightweight Express server for handling HTTP requests related to GitHub webhook events.
 *
 * This server provides one main functionality:
 * - GitHub Webhook Handler (GWH or a.k.a KGWH)
 * 
 * GWH listens for push events from the bot specified GitHub repository and sets a flag to indicate that an update is pending, allowing the bot to react accordingly.
 *  
 * 'http.ts' includes a simple testing endpoint to verify that the API is running.
 * 
 * Still, the GitHub webhook handler is there to allow the bot to automatically detect new commits and trigger updates without manual intervention!
 * BTW, you need to create an GitHub webhook pointing to `https://your-server.com/github-webhook` with the secret you set in `GITHUB_WEBHOOK_SECRET` and subscribe to push events for it to work!
 * Feel free to create an issue if you have any questions or need help setting it up! :D
 * 
 * Note: You will need the necessary environment variable (`GITHUB_WEBHOOK_SECRET`) set for the HTTP API to function correctly!
 * 
 * Enjoy! :D
 */
import express from "express";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const app = express();
app.use(express.json());

export const updateStatus = {
  isUpdatePending: false,
};

/**
 * GitHub Webhook Handler
 */
app.post("/github-webhook", (req, res) => {
  const signature = req.headers["x-hub-signature-256"];
  const event = req.headers["x-github-event"];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (secret && signature) {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(
      "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex"),
      "utf8",
    );
    const checksum = Buffer.from(signature as string, "utf8");

    if (
      checksum.length !== digest.length ||
      !crypto.timingSafeEqual(digest, checksum)
    ) {
      console.warn("[http-api]: Unauthorized webhook attempt.");
      return res.status(401).send("Invalid signature");
    }
  }

  if (event === "push") {
    console.log("[http-api]: New commit detected. Bot is updating...");
    updateStatus.isUpdatePending = true;
  }

  res.status(200).send("OK");
});

app.get("/api/test", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export { app };
